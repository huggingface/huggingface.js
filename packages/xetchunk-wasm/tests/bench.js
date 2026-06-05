import { parseArgs } from "node:util";
import { createChunker, finalize, nextBlock, hashToHex } from "../dist/esm/index.js";
import { createReadStream } from "node:fs";
import { Chunker } from "../vendor/chunker_wasm.js";

const { positionals } = parseArgs({
	args: process.argv.slice(2),
	allowPositionals: true,
});

const BYTES = 100_000_000;
const CHUNK_SIZE = 10_000_000;
const ROUNDS = 5;
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
	`data loaded in memory, processing ${CHUNK_SIZE.toLocaleString("en-US")} bytes at a time, ${ROUNDS} rounds\n`
);

function runJS() {
	const chunker = createChunker(64 * 1024);
	const chunks = [];

	for (let i = 0; i < data.length; i += CHUNK_SIZE) {
		for (const c of nextBlock(chunker, data.subarray(i, i + CHUNK_SIZE))) {
			chunks.push({ hash: hashToHex(c.hash), length: c.length });
		}
	}

	const lastChunk = finalize(chunker);
	if (lastChunk) {
		chunks.push({ hash: hashToHex(lastChunk.hash), length: lastChunk.length });
	}

	return chunks;
}

function runRust() {
	const chunker = new Chunker(64 * 1024);
	const chunks = [];

	for (let i = 0; i < data.length; i += CHUNK_SIZE) {
		for (const c of chunker.add_data(data.subarray(i, i + CHUNK_SIZE))) {
			chunks.push({ hash: c.hash, length: c.length });
		}
	}

	for (const c of chunker.finish()) {
		chunks.push({ hash: c.hash, length: c.length });
	}
	chunker.free();

	return chunks;
}

// --- Verify identical boundaries ---
console.log("Verifying chunk boundaries match...");
const jsChunks = runJS();
const rustChunks = runRust();

if (jsChunks.length !== rustChunks.length) {
	console.error(`MISMATCH: JS produced ${jsChunks.length} chunks, Rust produced ${rustChunks.length}`);
	process.exit(1);
}

let mismatchCount = 0;
let offset = 0;
for (let i = 0; i < jsChunks.length; i++) {
	const js = jsChunks[i];
	const rs = rustChunks[i];
	if (js.length !== rs.length || js.hash !== rs.hash) {
		if (mismatchCount < 5) {
			console.error(`  chunk ${i} @ offset ${offset}: JS(len=${js.length}, hash=${js.hash}) vs Rust(len=${rs.length}, hash=${rs.hash})`);
		}
		mismatchCount++;
	}
	offset += js.length;
}

if (mismatchCount > 0) {
	console.error(`MISMATCH: ${mismatchCount} / ${jsChunks.length} chunks differ`);
	process.exit(1);
}
console.log(`✓ ${jsChunks.length} chunks, all boundaries and hashes match\n`);

// --- Benchmark ---
function bench(label, fn) {
	const times = [];
	for (let r = 0; r < ROUNDS; r++) {
		const start = performance.now();
		fn();
		times.push(performance.now() - start);
	}
	times.sort((a, b) => a - b);
	const median = times[Math.floor(ROUNDS / 2)];
	const best = times[0];
	const worst = times[ROUNDS - 1];
	const mbps = (BYTES / 1_000_000) / (median / 1000);
	console.log(`${label}: median ${median.toFixed(1)}ms (best ${best.toFixed(1)}, worst ${worst.toFixed(1)}) → ${mbps.toFixed(1)} MB/s`);
	return mbps;
}

const jsMbps = bench(`JS   (gearhash-jit + blake3-jit, ${ROUNDS} rounds)`, runJS);
const rsMbps = bench(`Rust (thin-wasm,                ${ROUNDS} rounds)`, runRust);

console.log(`\nJS: ${jsMbps.toFixed(1)} MB/s | Rust: ${rsMbps.toFixed(1)} MB/s | ratio: ${((jsMbps / rsMbps) * 100).toFixed(1)}%`);
