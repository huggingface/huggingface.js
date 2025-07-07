import { createChunker, finalize, nextBlock, getChunks } from "../build/debug.js";
import { createRandomArray } from "@huggingface/splitmix64-wasm";

import assert from "assert";

// Helper function to get chunk boundaries from chunks
function getChunkBoundaries(chunks) {
	let pos = 0;
	return chunks.map((chunk) => {
		pos += chunk.length;
		return pos;
	});
}

// Test 1: Basic functionality with 1MB random data
async function testCorrectness1mbRandomData() {
	console.log("Testing 1MB random data...");

	// Create 1MB of random data with seed 0
	const dataBuffer = createRandomArray(1000000, 0);
	const data = new Uint8Array(dataBuffer);

	// Verify specific byte values (from Rust reference)
	assert.strictEqual(data[0], 175);
	assert.strictEqual(data[127], 132);
	assert.strictEqual(data[111111], 118);

	const referenceSha256 = "b3d0a1f7938cd4d8413a4dcffd4313e2e8ac0cb61cb1090eb140ea8e9154befb";
	const sha256 = await crypto.subtle.digest("SHA-256", data);
	const sha256Hex = Array.from(new Uint8Array(sha256))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	assert.strictEqual(sha256Hex, referenceSha256);
	console.log("✓ 1MB random data sha256 test passed");

	// Get chunks using the default chunker
	const chunks = getChunks(data);

	// Get chunk boundaries
	const chunkBoundaries = getChunkBoundaries(chunks);

	// Expected boundaries from Rust reference
	const expectedBoundaries = [
		84493, 134421, 144853, 243318, 271793, 336457, 467529, 494581, 582000, 596735, 616815, 653164, 678202, 724510,
		815591, 827760, 958832, 991092, 1000000,
	];

	assert.deepStrictEqual(chunkBoundaries, expectedBoundaries);
	console.log("✓ 1MB random data test passed");
}

// Test 2: Constant data test
function testCorrectness1mbConstData() {
	console.log("Testing 1MB constant data...");

	// Create 1MB of constant data (value 59)
	const data = new Uint8Array(1000000);
	data.fill(59);

	// Get chunks using the default chunker
	const chunks = getChunks(data);

	// Get chunk boundaries
	const chunkBoundaries = getChunkBoundaries(chunks);

	// Expected boundaries from Rust reference
	const expectedBoundaries = [131072, 262144, 393216, 524288, 655360, 786432, 917504, 1000000];

	assert.deepStrictEqual(chunkBoundaries, expectedBoundaries);
	console.log("✓ 1MB constant data test passed");
}

// Test 3: Chunk boundary consistency test
function testChunkBoundaries() {
	console.log("Testing chunk boundary consistency...");

	// Create 256KB of random data with seed 1
	const dataBuffer = createRandomArray(256000, 1n);
	const data = new Uint8Array(dataBuffer);

	// Get reference chunks using the default chunker
	const refChunks = getChunks(data);
	const refChunkBoundaries = getChunkBoundaries(refChunks);

	// Test with different block sizes
	for (const addSize of [1, 37, 255]) {
		const chunker = createChunker();
		const altChunks = [];

		let pos = 0;
		while (pos < data.length) {
			const nextPos = Math.min(pos + addSize, data.length);
			const nextChunk = nextBlock(chunker, data.subarray(pos, nextPos));
			altChunks.push(...nextChunk);
			pos = nextPos;
		}

		// Finalize to get any remaining chunk
		const finalChunk = finalize(chunker);
		if (finalChunk) {
			altChunks.push(finalChunk);
		}

		const altBoundaries = getChunkBoundaries(altChunks);
		assert.deepStrictEqual(altBoundaries, refChunkBoundaries);
	}

	console.log("✓ Chunk boundary consistency test passed");
}

// Test 4: Triggering data test (simplified version)
function testTriggeringData() {
	console.log("Testing triggering data...");

	// Create a pattern that triggers boundary detection
	// This is a simplified version of the Rust test
	const pattern = new Uint8Array([
		154, 52, 42, 34, 159, 75, 126, 224, 70, 236, 12, 196, 79, 236, 178, 124, 127, 50, 99, 178, 44, 176, 174, 126, 250,
		235, 205, 174, 252, 122, 35, 10, 20, 101, 214, 69, 193, 8, 115, 105, 158, 228, 120, 111, 136, 162, 198, 251, 211,
		183, 253, 252, 164, 147, 63, 16, 186, 162, 117, 23, 170, 36, 205, 187, 174, 76, 210, 174, 211, 175, 12, 173, 145,
		59, 2, 70, 222, 181, 159, 227, 182, 156, 189, 51, 226, 106, 24, 50, 183, 157, 140, 10, 8, 23, 212, 70, 10, 234, 23,
		33, 219, 254, 39, 236, 70, 49, 191, 116, 9, 115, 15, 101, 26, 159, 165, 220, 15, 170, 56, 125, 92, 163, 94, 235, 38,
		40, 49, 81,
	]);

	// Create 64KB of data by repeating the pattern
	const data = new Uint8Array(65536);
	let pos = 0;
	while (pos < data.length) {
		const remaining = data.length - pos;
		const copySize = Math.min(pattern.length, remaining);
		data.set(pattern.subarray(0, copySize), pos);
		pos += copySize;
	}

	// Test with different padding values
	const testCases = [
		{ padding: 0, expectedBoundaries: [8256, 16448, 24640, 32832, 41024, 49216, 57408, 65536] },
		{ padding: 1, expectedBoundaries: [8191, 16447, 24703, 32959, 41215, 49471, 57727, 65536] },
		{ padding: 2, expectedBoundaries: [8254, 16574, 24894, 33214, 41534, 49854, 58174, 65536] },
	];

	for (const testCase of testCases) {
		// Create data with specific padding
		const paddedData = new Uint8Array(65536 + testCase.padding);
		paddedData.set(data);
		paddedData.fill(0, 65536); // Add padding

		// Verify the specific byte at position 11111
		if (testCase.padding === 0) {
			assert.strictEqual(paddedData[11111], 236);
		} else if (testCase.padding === 1) {
			assert.strictEqual(paddedData[11111], 50);
		} else if (testCase.padding === 2) {
			assert.strictEqual(paddedData[11111], 36);
		}

		// Get chunks
		const chunks = getChunks(paddedData);
		const chunkBoundaries = getChunkBoundaries(chunks);

		assert.deepStrictEqual(chunkBoundaries, testCase.expectedBoundaries);
	}

	console.log("✓ Triggering data test passed");
}

// Test 5: Basic chunker functionality
function testBasicChunkerFunctionality() {
	console.log("Testing basic chunker functionality...");

	// Create a small test data
	const data = new Uint8Array(100000);
	for (let i = 0; i < data.length; i++) {
		data[i] = Math.floor(Math.random() * 256);
	}

	// Test chunker creation and usage
	const chunker = createChunker();
	const chunks = nextBlock(chunker, data);
	const finalChunk = finalize(chunker);

	// Verify chunks have the expected structure
	for (const chunk of chunks) {
		assert.strictEqual(typeof chunk.length, "number");
		assert.strictEqual(typeof chunk.hash, "object");
		assert.strictEqual(chunk.hash instanceof Uint8Array, true);
	}

	if (finalChunk) {
		assert.strictEqual(typeof finalChunk.length, "number");
		assert.strictEqual(typeof finalChunk.hash, "object");
		assert.strictEqual(finalChunk.hash instanceof Uint8Array, true);
	}

	console.log("✓ Basic chunker functionality test passed");
}

// Run all tests
console.log("Running xetchunk-wasm tests...\n");

try {
	testChunkBoundaries();
	testCorrectness1mbConstData();
	testBasicChunkerFunctionality();
	await testCorrectness1mbRandomData();
	testTriggeringData();

	console.log("\n🎉 All tests passed!");
} catch (error) {
	console.error("❌ Test failed:", error.message);
	process.exit(1);
}
