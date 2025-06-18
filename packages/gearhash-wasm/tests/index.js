import { nextMatch, nextMatches } from "../build/debug.js";

// Simple deterministic RNG for reproducible results (32-bit version)
class SimpleRng {
	constructor(seed) {
		this.state = seed;
	}

	nextU32() {
		// Simple 32-bit xorshift algorithm (same as Rust version)
		this.state ^= this.state << 13;
		this.state ^= this.state >> 17;
		this.state ^= this.state << 5;
		return this.state;
	}

	nextU64() {
		// Generate two 32-bit values and combine them
		const low = this.nextU32();
		const high = this.nextU32();
		return (BigInt(high) << 32n) | BigInt(low);
	}

	fillBytes(dest) {
		for (let i = 0; i < dest.length; i += 8) {
			const value = this.nextU64();
			for (let j = 0; j < 8 && i + j < dest.length; j++) {
				dest[i + j] = Number((value >> BigInt(j * 8)) & 0xffn);
			}
		}
	}
}

const BENCH_INPUT_SEED = 0xbecd17f;
const BENCH_MASK = 0x0000d90003530000n;
const INPUT_SIZE = 100_000;

function generateTestInput() {
	const bytes = new Uint8Array(INPUT_SIZE);
	const rng = new SimpleRng(BENCH_INPUT_SEED);
	rng.fillBytes(bytes);
	return bytes;
}

function testGearhash() {
	console.log(`Generating test input with seed: 0x${BENCH_INPUT_SEED.toString(16)}`);
	const inputBuf = generateTestInput();
	console.log(`Input size: ${inputBuf.length} bytes`);
	console.log(`Mask: 0x${BENCH_MASK.toString(16)}`);

	let offset = 0;
	let chunkCount = 0;
	let totalProcessed = 0;
	let hash = 0n;

	console.log("\nProcessing chunks:");
	console.log("Chunk | Offset | Size | Hash");
	console.log("------|--------|------|------------------");

	const result = nextMatches(inputBuf, BENCH_MASK, 0);
	const matches = [...result.matches, { position: result.remaining, hash: result.hash }];

	for (const match of matches) {
		offset += match.position;
		totalProcessed += match.position;
		chunkCount += 1;
		hash = match.hash;

		console.log(
			`${chunkCount.toString().padStart(5)} | ${offset.toString().padStart(6)} | ${match.position
				.toString()
				.padStart(4)} | 0x${match.hash.toString(16).padStart(16, "0")}`
		);
	}

	console.log("\nSummary:");
	console.log(`Total chunks: ${chunkCount}`);
	console.log(`Total bytes processed: ${totalProcessed}`);
	console.log(`Average chunk size: ${(totalProcessed / chunkCount).toFixed(1)} bytes`);

	// Print first few bytes of each chunk for verification
	console.log("\nFirst 16 bytes of each chunk:");
	offset = 0;
	chunkCount = 0;
	hash = 0n;

	while (offset < inputBuf.length) {
		const result = nextMatch(inputBuf.subarray(offset), BENCH_MASK, hash);
		if (result.matchSize > 0) {
			const chunk = inputBuf.subarray(offset, offset + result.matchSize);
			const hexBytes = Array.from(chunk.slice(0, Math.min(16, chunk.length)))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			console.log(`Chunk ${chunkCount + 1}: ${hexBytes}`);
			offset += result.matchSize;
			chunkCount += 1;
			hash = result.hash;
		} else {
			const chunk = inputBuf.subarray(offset);
			const hexBytes = Array.from(chunk.slice(0, Math.min(16, chunk.length)))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			console.log(`Chunk ${chunkCount + 1}: ${hexBytes} (final)`);
			break;
		}
	}

	return { chunkCount, totalProcessed, averageChunkSize: totalProcessed / chunkCount };
}

// Parse the expected results from Rust
function parseExpectedResults(resultData) {
	const lines = resultData.trim().split("\n");
	const results = [];

	for (const line of lines) {
		const match = line.match(/\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(0x[a-f0-9]+)/);
		if (match) {
			results.push({
				chunk: parseInt(match[1]),
				offset: parseInt(match[2]),
				size: parseInt(match[3]),
				hash: match[4],
			});
		}
	}

	return results;
}

const resultData = `
    1 |      0 | 5919 | 0x17c402cb182c5718
    2 |   5919 |  265 | 0xe739063654888081
    3 |   6184 | 4855 | 0x38a82261e80810f9
    4 |  11039 | 1029 | 0x803f24c9ac20ddd5
    5 |  12068 |  583 | 0xb4b724e26824ace3
    6 |  12651 |  358 | 0x11bd22180c0c5ac5
    7 |  13009 | 3078 | 0x810a04be24846ffc
    8 |  16087 | 1207 | 0x5f940641d088dada
    9 |  17294 |  251 | 0xf09502d5f4acfb4e
   10 |  17545 | 3053 | 0xf0b120d014ace72d
   11 |  20598 | 9120 | 0xa458064aa82403e5
   12 |  29718 | 3288 | 0x9ccf04ecc000996b
   13 |  33006 |  590 | 0xd4ba00dd9408b6b5
   14 |  33596 | 1401 | 0xd42a2000a4a46d11
   15 |  34997 | 2573 | 0xc914022f9c28e722
   16 |  37570 | 1300 | 0xd63b0401a484c0bc
   17 |  38870 |   98 | 0x996f0499402c1e96
   18 |  38968 | 2802 | 0xf43406dfb42c9324
   19 |  41770 | 3237 | 0x1bd026252c0ccbe3
   20 |  45007 | 7368 | 0x7da400e8e0aca934
   21 |  52375 |  439 | 0xcd9b208f38201fa7
   22 |  52814 | 1477 | 0x9497226484a0a015
   23 |  54291 | 7158 | 0x5a3100fa9888dfe5
   24 |  61449 | 2168 | 0x21ed20bbf008a4ef
   25 |  63617 | 2475 | 0x7b0522392480392d
   26 |  66092 |   26 | 0xdfe6048a9c0c125f
   27 |  66118 | 7548 | 0xf8a72278802c1523
   28 |  73666 | 7826 | 0x5997242ba00cb3fd
   29 |  81492 |  215 | 0x489e26bd7c08ec4c
   30 |  81707 |  760 | 0x84d526f1542066b2
   31 |  82467 | 1929 | 0x085d02a31024d324
   32 |  84396 | 3947 | 0x8cc4240eb8a8b8e3
   33 |  88343 | 1511 | 0x98b1204ccc001231
   34 |  89854 | 2895 | 0x35402430a8a8d1f1
   35 |  92749 | 7025 | 0x52bd0269e8084b97
   36 |  99774 |  226 | 0xd86ff8f143fe10b4 `;

console.log("ok");

// Run the test and capture output for comparison
console.log("\n" + "=".repeat(50));
console.log("RUNNING GEARHASH TEST");
console.log("=".repeat(50));

// Capture console output for comparison
const originalLog = console.log;
let capturedOutput = [];

console.log = function (...args) {
	capturedOutput.push(args.join(" "));
	originalLog.apply(console, args);
};

// Run the test
const testResults = testGearhash();

// Restore console.log
console.log = originalLog;

// Extract the chunk data from captured output
const chunkLines = capturedOutput.filter((line) => line.match(/^\s*\d+\s*\|\s*\d+\s*\|\s*\d+\s*\|\s*0x[a-f0-9]+/));

// Format the captured results for comparison
const capturedResultData = chunkLines.join("\n");

console.log("\n" + "=".repeat(50));
console.log("COMPARISON RESULTS");
console.log("=".repeat(50));

// Compare with expected results
const expectedResults = parseExpectedResults(resultData);
const actualResults = parseExpectedResults(capturedResultData);

let matches = 0;
let totalChunks = Math.min(actualResults.length, expectedResults.length);

console.log(`Comparing ${totalChunks} chunks...`);

for (let i = 0; i < totalChunks; i++) {
	const actual = actualResults[i];
	const expected = expectedResults[i];

	if (actual.offset === expected.offset && actual.size === expected.size && actual.hash === expected.hash) {
		matches++;
	} else {
		console.log(`❌ Mismatch at chunk ${i + 1}:`);
		console.log(`   Expected: offset=${expected.offset}, size=${expected.size}, hash=${expected.hash}`);
		console.log(`   Actual:   offset=${actual.offset}, size=${actual.size}, hash=${actual.hash}`);
	}
}

console.log(`\n✅ Results: ${matches}/${totalChunks} chunks match exactly`);
console.log(`📊 Accuracy: ${((matches / totalChunks) * 100).toFixed(2)}%`);

if (matches === totalChunks) {
	console.log("🎉 All chunks match! AssemblyScript implementation is correct.");
} else {
	console.log("⚠️  Some chunks don't match. Check the implementation.");
}

// Test summary
console.log("\n" + "=".repeat(50));
console.log("TEST SUMMARY");
console.log("=".repeat(50));
console.log(`Total chunks processed: ${testResults.chunkCount}`);
console.log(`Total bytes processed: ${testResults.totalProcessed}`);
console.log(`Average chunk size: ${testResults.averageChunkSize.toFixed(1)} bytes`);
console.log(`Matching chunks: ${matches}/${totalChunks}`);
console.log(`Accuracy: ${((matches / totalChunks) * 100).toFixed(2)}%`);
