/**
 * Per-stage breakdown of the JS chunking pipeline.
 *
 * Measures, separately:
 *   - gearhash: the boundary scan alone (same scan-skip pattern as the chunker)
 *   - blake3:   keyed hashing of the resulting chunks alone
 *   - hex:      hashToHex over all chunk hashes (cost paid by bench.js/consumers)
 *   - e2e:      the real pipeline (streaming nextBlock, 10MB blocks)
 *   - glue:     e2e minus gearhash minus blake3 (chunk objects, subarrays, copies)
 *
 * Usage: node tests/bench-stages.js [file] [--size 100000000] [--target 65536] [--rounds 5]
 */
import { parseArgs } from "node:util";
import { createChunker, nextBlock, finalize, getChunks, hashToHex } from "../dist/esm/index.js";
import { Hasher as GearHasher } from "gearhash-jit";
import { Hasher as Blake3Hasher } from "@huggingface/blake3-jit";
import { makeData, loadFile, benchAll, fmtMBps } from "./bench-lib.js";

const { positionals, values } = parseArgs({
	args: process.argv.slice(2),
	allowPositionals: true,
	options: {
		size: { type: "string", default: "100000000" },
		target: { type: "string", default: String(64 * 1024) },
		rounds: { type: "string", default: "5" },
		data: { type: "string", default: "random" },
	},
});

const BYTES = parseInt(values.size);
const TARGET = parseInt(values.target);
const ROUNDS = parseInt(values.rounds);
const BLOCK = 10_000_000;

const BLAKE3_DATA_KEY = new Uint8Array([
	102, 151, 245, 119, 91, 149, 80, 222, 49, 53, 203, 172, 165, 151, 24, 28, 157, 228, 33, 16, 155, 235, 43, 88, 180,
	208, 176, 75, 147, 173, 242, 41,
]);

const data = positionals[0] ? await loadFile(positionals[0], BYTES) : makeData(values.data, BYTES);
console.log(
	`stage breakdown | ${BYTES.toLocaleString("en-US")} bytes (${positionals[0] ?? values.data}) | target ${TARGET / 1024}KB | median of ${ROUNDS} rounds\n`
);

// Chunker parameters (must mirror xet-chunker.ts)
const minimumChunk = TARGET / 8;
const maximumChunk = TARGET * 2;
const HASH_WINDOW_SIZE = 64;
const minSkip = minimumChunk > HASH_WINDOW_SIZE ? minimumChunk - HASH_WINDOW_SIZE - 1 : 0;

let mask = BigInt(TARGET - 1);
let leadingZeros = 0;
for (let i = 63; i >= 0; i--) {
	if ((mask & (1n << BigInt(i))) !== 0n) break;
	leadingZeros++;
}
mask <<= BigInt(leadingZeros);

// --- Stage: gearhash scan alone (same scan-skip pattern as nextBlock) ---
const gear = new GearHasher(mask);
const LOAD_SIZE = Math.max(4 * 1024 * 1024, 4 * maximumChunk);
let boundaryCount = 0;
function gearScan() {
	boundaryCount = 0;
	gear.resetHash();
	let loadedStart = 0;
	let loadedEnd = 0;
	let pos = 0;
	while (pos < data.length) {
		const scanStart = Math.min(pos + minSkip, data.length);
		const scanEnd = Math.min(data.length, pos + maximumChunk);
		if (pos < loadedStart || scanEnd > loadedEnd) {
			loadedStart = pos;
			loadedEnd = Math.min(data.length, pos + LOAD_SIZE);
			gear.loadInput(data.subarray(loadedStart, loadedEnd));
		}
		const position = gear.nextMatchIn(scanStart - loadedStart, scanEnd - scanStart);
		let chunkEnd;
		if (position !== -1 && scanStart + position - pos <= maximumChunk) {
			chunkEnd = scanStart + position;
		} else if (scanEnd - pos >= maximumChunk) {
			chunkEnd = pos + maximumChunk;
		} else {
			break; // tail
		}
		boundaryCount++;
		pos = chunkEnd;
		gear.resetHash();
	}
}

// --- Stage: blake3 keyed hashing alone (over real chunk boundaries) ---
const refChunks = getChunks(data, TARGET);
const boundaries = [];
{
	let off = 0;
	for (const c of refChunks) {
		boundaries.push([off, off + c.length]);
		off += c.length;
	}
}
const blake3 = Blake3Hasher.newKeyed(BLAKE3_DATA_KEY);
function blake3Only() {
	for (const [start, end] of boundaries) {
		blake3.reset().update(data.subarray(start, end)).finalize(32);
	}
}

// --- Stage: hashToHex over all chunk hashes ---
function hexOnly() {
	for (const c of refChunks) hashToHex(c.hash);
}

// --- E2E: streaming nextBlock in 10MB blocks (like tests/bench.js, minus hex) ---
function e2e() {
	const chunker = createChunker(TARGET);
	const chunks = [];
	for (let i = 0; i < data.length; i += BLOCK) {
		for (const c of nextBlock(chunker, data.subarray(i, i + BLOCK))) chunks.push(c);
	}
	const last = finalize(chunker);
	if (last) chunks.push(last);
	return chunks;
}

// --- E2E: one-shot getChunks ---
function e2eOneShot() {
	return getChunks(data, TARGET);
}

const [rGear, rBlake, rHex, rE2E, rOneShot] = benchAll([gearScan, blake3Only, hexOnly, e2e, e2eOneShot], BYTES, {
	rounds: ROUNDS,
});
const glueMs = rE2E.medianMs - rGear.medianMs - rBlake.medianMs;

function row(label, ms, mbps, extra = "") {
	console.log(`${label.padEnd(26)} ${ms.toFixed(1).padStart(8)}ms  ${fmtMBps(mbps).padStart(10)}${extra}`);
}

row("gearhash scan", rGear.medianMs, rGear.mbps, `  (${boundaryCount + 1} chunks)`);
row("blake3 keyed hash", rBlake.medianMs, rBlake.mbps, `  (${boundaries.length} chunks)`);
row("hashToHex (extra)", rHex.medianMs, BYTES / 1_000_000 / (rHex.medianMs / 1000));
row("glue (e2e - stages)", glueMs, BYTES / 1_000_000 / (glueMs / 1000));
console.log("-".repeat(50));
row("e2e streaming (10MB)", rE2E.medianMs, rE2E.mbps);
row("e2e one-shot getChunks", rOneShot.medianMs, rOneShot.mbps);
