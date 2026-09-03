/**
 * E2E throughput matrix: JS vs vendored Rust wasm across
 *   - target chunk sizes (8KB / 64KB / 1MB)
 *   - input feed (streaming 64KB / 1MB / 10MB blocks, one-shot)
 *   - data types (random / zeros / text-like)
 *
 * Usage: node tests/bench-matrix.js [file] [--size 32000000] [--rounds 5]
 *   With a file positional, the "data types" axis collapses to just the file.
 */
import { parseArgs } from "node:util";
import { createChunker, nextBlock, finalize, getChunks } from "../dist/esm/index.js";
import { Chunker as RustChunker } from "../vendor/chunker_wasm.js";
import { makeData, loadFile, bench, silenced, fmtMBps, fmtSize } from "./bench-lib.js";

const { positionals, values } = parseArgs({
	args: process.argv.slice(2),
	allowPositionals: true,
	options: {
		size: { type: "string", default: "32000000" },
		rounds: { type: "string", default: "5" },
	},
});

const BYTES = parseInt(values.size);
const ROUNDS = parseInt(values.rounds);
const TARGETS = [8 * 1024, 64 * 1024, 1024 * 1024];
const BLOCKS = [64 * 1024, 1024 * 1024, 10 * 1024 * 1024, 0]; // 0 = one-shot
const DATA_KINDS = positionals[0] ? [positionals[0]] : ["random", "zeros", "text"];

function runJS(data, target, block) {
	if (block === 0) return getChunks(data, target).length;
	const chunker = createChunker(target);
	let n = 0;
	for (let i = 0; i < data.length; i += block) {
		n += nextBlock(chunker, data.subarray(i, i + block)).length;
	}
	if (finalize(chunker)) n++;
	return n;
}

function runRust(data, target, block) {
	const chunker = new RustChunker(target);
	let n = 0;
	const step = block === 0 ? data.length : block;
	for (let i = 0; i < data.length; i += step) {
		n += chunker.add_data(data.subarray(i, i + step)).length;
	}
	n += chunker.finish().length;
	chunker.free();
	return n;
}

console.log(
	`matrix | ${BYTES.toLocaleString("en-US")} bytes | median of ${ROUNDS} rounds | JS vs Rust wasm\n`
);
console.log(
	`${"data".padEnd(8)} ${"target".padEnd(7)} ${"feed".padEnd(9)} ${"JS".padStart(10)} ${"Rust".padStart(10)} ${"ratio".padStart(7)}  chunks`
);

for (const kind of DATA_KINDS) {
	const data = positionals[0] ? await loadFile(positionals[0], BYTES) : makeData(kind, BYTES);
	const label = positionals[0] ? "file" : kind;
	for (const target of TARGETS) {
		for (const block of BLOCKS) {
			let nChunks = 0;
			const js = bench(() => {
				nChunks = runJS(data, target, block);
			}, BYTES, { rounds: ROUNDS });
			const rust = bench(silenced(() => runRust(data, target, block)), BYTES, { rounds: ROUNDS });
			console.log(
				`${label.padEnd(8)} ${fmtSize(target).padEnd(7)} ${(block === 0 ? "one-shot" : fmtSize(block)).padEnd(9)} ` +
					`${fmtMBps(js.mbps).padStart(10)} ${fmtMBps(rust.mbps).padStart(10)} ` +
					`${((js.mbps / rust.mbps) * 100).toFixed(0).padStart(6)}%  ${nChunks}`
			);
		}
	}
	console.log("");
}
