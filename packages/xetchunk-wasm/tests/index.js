import { createChunker, finalize, nextBlock } from "../build/debug.js";

const chunker = createChunker(Math.pow(2, 12));

const data = new Uint8Array(100_000);

for (let i = 0; i < data.length; i++) {
	data[i] = i;
}

const chunks = nextBlock(chunker, data);

console.log("chunks", chunks);

const lastChunk = finalize(chunker);

console.log("lastChunk", lastChunk);
