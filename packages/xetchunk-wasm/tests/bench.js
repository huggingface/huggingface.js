import { parseArgs } from "node:util";
import { createChunker, finalize, nextBlock } from "../dist/esm/index.js";
import { createReadStream } from "node:fs";
import { Chunker } from "../vendor/chunker_wasm.js";

const { positionals } = parseArgs({
	args: process.argv.slice(2),
	allowPositionals: true,
});

const BYTES = 100_000_000;
const CHUNK_SIZE = 10_000_000;
const data = new Uint8Array(BYTES);

if (!positionals[0]) {
	for (let i = 0; i < data.length; i++) {
		data[i] = Math.floor(Math.random() * 256);
	}
} else {
	console.log(`loading first ${BYTES.toLocaleString("en-US")} bytes of data in memory`);

	const stream = createReadStream(positionals[0]);
	let totalRead = 0;

	for await (const chunk of stream) {
		data.set(chunk.slice(0, data.length - totalRead), totalRead);
		totalRead += chunk.length;

		if (totalRead >= data.length) {
			stream.close();
			break;
		}
	}

	if (totalRead < data.length) {
		console.log("not enough data, repeating in memory");

		while (totalRead < data.length) {
			data.set(data.slice(0, BYTES), totalRead);
			totalRead += BYTES;
		}
	}
}

console.log(
	`data loaded in memory, processing ${CHUNK_SIZE.toLocaleString("en-US")} bytes at a time\n`
);

function benchJS() {
	const start = performance.now();
	const chunker = createChunker(64 * 1024);

	let totalProcessed = 0;
	let totalChunks = 0;

	for (let i = 0; i < data.length; i += CHUNK_SIZE) {
		const chunks = nextBlock(chunker, data.subarray(i, i + CHUNK_SIZE));
		totalProcessed += CHUNK_SIZE;
		totalChunks += chunks.length;
	}

	const lastChunk = finalize(chunker);
	if (lastChunk) {
		totalChunks += 1;
		totalProcessed = data.length;
	}

	const elapsed = performance.now() - start;
	return { elapsed, totalChunks, totalProcessed };
}

function benchRust() {
	const start = performance.now();
	const chunker = new Chunker(64 * 1024);

	let totalProcessed = 0;
	let totalChunks = 0;

	for (let i = 0; i < data.length; i += CHUNK_SIZE) {
		const chunks = chunker.add_data(data.subarray(i, i + CHUNK_SIZE));
		totalProcessed += CHUNK_SIZE;
		totalChunks += chunks.length;
	}

	const finalChunks = chunker.finish();
	if (finalChunks.length > 0) {
		totalChunks += finalChunks.length;
		totalProcessed = data.length;
	}
	chunker.free();

	const elapsed = performance.now() - start;
	return { elapsed, totalChunks, totalProcessed };
}

function formatResult(label, { elapsed, totalChunks, totalProcessed }) {
	const mbps = (totalProcessed / 1_000_000 / (elapsed / 1000)).toFixed(1);
	console.log(`${label}: ${totalChunks} chunks in ${elapsed.toFixed(1)}ms → ${mbps} MB/s`);
	return Number(mbps);
}

// Warmup
benchJS();
benchRust();

// Measured runs
console.log("--- JS (gearhash-jit + blake3-jit) ---");
const js1 = formatResult("  run 1", benchJS());
const js2 = formatResult("  run 2", benchJS());

console.log("\n--- Rust (thin-wasm) ---");
const rs1 = formatResult("  run 1", benchRust());
const rs2 = formatResult("  run 2", benchRust());

const jsAvg = (js1 + js2) / 2;
const rsAvg = (rs1 + rs2) / 2;
console.log(`\nJS avg: ${jsAvg.toFixed(1)} MB/s | Rust avg: ${rsAvg.toFixed(1)} MB/s | ratio: ${((jsAvg / rsAvg) * 100).toFixed(1)}%`);
