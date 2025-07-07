import { createChunker, finalize, nextBlock, generateRandomArray } from "../build/debug.js";
import assert from "assert";

const data1 = generateRandomArray(100_000, 0);

// log first 8 bytes
console.log(data1.slice(0, 8));

// Do same with nextUint64 instead of nextUint8
const prng64 = splitmix64([0, 0]);

for (let i = 0; i < 8; i++) {
	const value = nextUint64(prng64);
	console.log(value);

	// Log all 8 bytes
	console.log(value[0].toString(16));
	console.log(value[1].toString(16));
}

assert.strictEqual(data1[0], 175);

// const chunker = createChunker(Math.pow(2, 12));

// const data = new Uint8Array(100_000);

// for (let i = 0; i < data.length; i++) {
// 	data[i] = Math.floor(Math.random() * 256);
// }

// const chunks = nextBlock(chunker, data);

// console.log("chunks", chunks);

// const lastChunk = finalize(chunker);

// console.log("lastChunk", lastChunk);
