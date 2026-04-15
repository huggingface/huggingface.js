import { parseArgs } from "node:util";
import { createChunker, finalize, nextBlock } from "../dist/esm/index.js";
import { createReadStream } from "node:fs";

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
	`data loaded in memory, starting to process data ${CHUNK_SIZE.toLocaleString(
		"en-US"
	)} bytes at a time (for a max of 30 seconds)`
);

function bench() {
	const start = performance.now();
	const chunker = createChunker(64 * 1024);

	let totalProcessed = 0;
	let totalChunks = 0;
	let stoppedEarly = false;

	for (let i = 0; i < data.length; i += CHUNK_SIZE) {
		const chunks = nextBlock(chunker, data.subarray(i, i + CHUNK_SIZE));
		console.log("chunks", chunks.length);
		totalProcessed += CHUNK_SIZE;
		totalChunks += chunks.length;

		if (performance.now() - start > 30_000) {
			console.log("30 seconds elapsed, stopping");
			stoppedEarly = true;
			break;
		}
	}

	if (!stoppedEarly) {
		const lastChunk = finalize(chunker);
		if (lastChunk) {
			totalChunks += 1;
			totalProcessed = data.length;
		}
	}

	console.log(
		`chunked ${totalChunks} chunks in ${performance.now() - start}ms, ${(
			totalProcessed /
			1_000_000 /
			((performance.now() - start) / 1000)
		).toFixed(3)} MB/s`
	);
}

// Warmup
bench();
// Measured
bench();
