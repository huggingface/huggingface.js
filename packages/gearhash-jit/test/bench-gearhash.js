/**
 * Micro-benchmark for the gearhash-jit nextMatch scan kernel.
 *
 * Measures throughput for:
 *   - `nextMatch` (per-call input copy + scan) — the legacy/streaming API
 *   - `loadInput` once + `nextMatchIn` windows — the zero-recopy API
 *   - a never-matching mask — pure kernel speed without match/reset overhead
 * across masks corresponding to 8KB / 64KB / 1MB target chunk sizes.
 *
 * Usage: node test/bench-gearhash.js [--size 67108864] [--rounds 5]
 */
import { parseArgs } from "node:util";
import { Hasher } from "../dist/esm/index.js";

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		size: { type: "string", default: String(64 * 1024 * 1024) },
		rounds: { type: "string", default: "5" },
	},
});

const BYTES = parseInt(values.size);
const ROUNDS = parseInt(values.rounds);

// Deterministic pseudo-random data (xorshift128)
const data = new Uint8Array(BYTES);
{
	let x = 0x9e3779b9, y = 0x243f6a88, z = 0xb7e15162, w = 0xdeadbeef;
	const words = new Uint32Array(data.buffer, 0, BYTES >>> 2);
	for (let i = 0; i < words.length; i++) {
		const t = x ^ (x << 11);
		x = y; y = z; z = w;
		w = (w ^ (w >>> 19) ^ (t ^ (t >>> 8))) | 0;
		words[i] = w;
	}
}

/** Mask used by the xet chunker for a given power-of-2 target chunk size. */
function maskForTarget(target) {
	let mask = BigInt(target - 1);
	let leadingZeros = 0;
	for (let i = 63; i >= 0; i--) {
		if ((mask & (1n << BigInt(i))) !== 0n) break;
		leadingZeros++;
	}
	return mask << BigInt(leadingZeros);
}

function bench(label, fn) {
	fn(); // warmup
	const times = [];
	for (let r = 0; r < ROUNDS; r++) {
		const start = performance.now();
		fn();
		times.push(performance.now() - start);
	}
	times.sort((a, b) => a - b);
	const medianMs = times[Math.floor(times.length / 2)];
	const gbps = BYTES / 1e9 / (medianMs / 1000);
	console.log(`${label.padEnd(44)} ${medianMs.toFixed(1).padStart(7)}ms  ${gbps.toFixed(2).padStart(6)} GB/s`);
}

console.log(`gearhash micro-bench | ${BYTES.toLocaleString("en-US")} bytes random | median of ${ROUNDS} rounds\n`);

// --- Pure kernel speed: mask that (practically) never matches ---
{
	const hasher = new Hasher(0xffffffffff000000n);
	const SEG = 4 * 1024 * 1024;
	bench("kernel only (no-match mask, 4MB segments)", () => {
		hasher.loadInput(data.subarray(0, SEG));
		for (let off = 0; off < data.length; off += SEG) {
			// re-scan the same loaded segment: isolates scan speed from memcpy
			hasher.nextMatchIn(0, Math.min(SEG, data.length - off));
		}
	});
	const hasher2 = new Hasher(0xffffffffff000000n);
	bench("kernel + copy (no-match mask, nextMatch)", () => {
		for (let off = 0; off < data.length; off += SEG) {
			hasher2.nextMatch(data.subarray(off, off + SEG));
		}
	});
}

console.log("");

// --- Chunker-style scanning (match → resetHash → continue) ---
for (const target of [8 * 1024, 64 * 1024, 1024 * 1024]) {
	const mask = maskForTarget(target);
	const label = `${target / 1024}KB target`;
	const maxChunk = target * 2;

	// Legacy API: one nextMatch (with copy) per window, like the chunker did
	{
		const hasher = new Hasher(mask);
		bench(`${label}, nextMatch (copy per window)`, () => {
			hasher.resetHash();
			let pos = 0;
			while (pos < data.length) {
				const end = Math.min(data.length, pos + maxChunk);
				const p = hasher.nextMatch(data.subarray(pos, end));
				pos = p === -1 ? end : pos + p;
				hasher.resetHash();
			}
		});
	}

	// Load-once API: copy each 4MB segment once, scan windows in place
	{
		const hasher = new Hasher(mask);
		const SEG = 4 * 1024 * 1024;
		bench(`${label}, loadInput + nextMatchIn`, () => {
			hasher.resetHash();
			let segStart = -1;
			let segEnd = -1;
			let pos = 0;
			while (pos < data.length) {
				const end = Math.min(data.length, pos + maxChunk);
				if (pos < segStart || end > segEnd) {
					segStart = pos;
					segEnd = Math.min(data.length, pos + SEG);
					hasher.loadInput(data.subarray(segStart, segEnd));
				}
				const p = hasher.nextMatchIn(pos - segStart, end - pos);
				pos = p === -1 ? end : pos + p;
				hasher.resetHash();
			}
		});
	}
}
