import { parseArgs } from "node:util";
import { createChunker, finalize, nextBlock } from "../build/release.js";
import { createReadStream } from "node:fs";

const { positionals } = parseArgs({
	args: process.argv.slice(2),
	allowPositionals: true,
});

if (!positionals[0]) {
	console.error("Usage: node tests/bench.js <filePathToChunk>");
	process.exit(1);
}

const GB = 1_000_000_000;

console.log("loading first GB of data in memory");
const data = new Uint8Array(GB);

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
		data.set(data.slice(0, GB), totalRead);
		totalRead += GB;
	}
}

console.log("data loaded in memory, starting to chunk in 64MB chunks (for a max of 30 seconds)");

const start = performance.now();
const chunker = createChunker();

let totalProcessed = 0;
let totalChunks = 0;
let stoppedEarly = false;

for (let i = 0; i < data.length; i += 64_000_000) {
	const chunks = nextBlock(chunker, data.slice(i, i + 64_000_000));
	totalProcessed += 64_000_000;
	totalChunks += chunks.length;

	if (performance.now() - start > 30_000) {
		console.log("30 seconds elapsed, stopping");
		stoppedEarly = true;
		break;
	}
}

if (!stoppedEarly) {
	const chunks = finalize(chunker);
	totalChunks += chunks.length;
	totalProcessed += chunks.length * chunks[0].length;
}

console.log(
	`chunked ${totalChunks} chunks in ${performance.now() - start}ms, ${(
		totalProcessed /
		1_000_000 /
		((performance.now() - start) / 1000)
	).toFixed(3)} MB/s`
);
