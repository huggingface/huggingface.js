import { nextMatch, nextMatches } from "../build/debug.js";

// Simple deterministic RNG for reproducible results (24-bit version)
class SimpleRng {
	constructor(seed) {
		this.state = seed & 0xffffff; // Keep only 24 bits
	}

	nextU24() {
		// Simple 24-bit linear congruential generator
		// Using 24-bit arithmetic to avoid overflow
		this.state = (this.state * 1111 + 12345) & 0xffffff;
		return this.state;
	}

	fillBytes(dest) {
		for (let i = 0; i < dest.length; i += 3) {
			const value = this.nextU24();
			for (let j = 0; j < 3 && i + j < dest.length; j++) {
				dest[i + j] = (value >> (j * 8)) & 0xff;
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
		totalProcessed += match.position;
		chunkCount += 1;
		hash = match.hash;

		console.log(
			`${chunkCount.toString().padStart(5)} | ${offset.toString().padStart(6)} | ${match.position
				.toString()
				.padStart(4)} | 0x${match.hash.toString(16).padStart(16, "0")}`
		);
		offset += match.position;
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

const resultData = `Chunk | Offset | Size | Hash
------|--------|------|------------------
    1 |      0 | 3598 | 0x033220f080ac5f77
    2 |   3598 | 3995 | 0xd06b22f324ac5f28
    3 |   7593 | 4708 | 0xa3a324f81808429c
    4 |  12301 |  484 | 0x12a5006aa4a4425b
    5 |  12785 | 1484 | 0x0b240413a4a4d5a2
    6 |  14269 |  563 | 0xc646022fbc848bc6
    7 |  14832 | 6663 | 0x7c7a2296e4a4c325
    8 |  21495 | 1220 | 0xbe1f2468f0841b68
    9 |  22715 | 1175 | 0xf87e2299e00c57d9
   10 |  23890 |  779 | 0x79ca2634d00cd6b9
   11 |  24669 | 2069 | 0xcb7a063594081a74
   12 |  26738 | 2623 | 0xdccc26b6c0acb733
   13 |  29361 |  596 | 0x4fb6201a1c20143e
   14 |  29957 |  622 | 0x81e726272020706f
   15 |  30579 | 3834 | 0x630622fca084a60a
   16 |  34413 | 2379 | 0x177b2240080810b1
   17 |  36792 | 3527 | 0x663b261bbc2451ed
   18 |  40319 | 1665 | 0xf94f06db94003e2f
   19 |  41984 | 1240 | 0xc5ca208c0c24cefc
   20 |  43224 | 1274 | 0x8139244f740cba39
   21 |  44498 | 3680 | 0x4440044520045a9d
   22 |  48178 | 1487 | 0xe00f2049a0a43a58
   23 |  49665 | 4293 | 0x366a26940408279d
   24 |  53958 | 1184 | 0x3a582683902cb3fe
   25 |  55142 |  383 | 0x002d0499e080702e
   26 |  55525 | 1206 | 0x34ba041aa4084fbd
   27 |  56731 |  506 | 0x0c53045c00a0a228
   28 |  57237 | 8019 | 0xf85b202d9c0813a5
   29 |  65256 | 1070 | 0x1c862295ac8863ba
   30 |  66326 | 3359 | 0x4e4804d7b82805c7
   31 |  69685 | 1744 | 0x75b7224cc8209457
   32 |  71429 |  152 | 0xb01e26b40c0cf7c0
   33 |  71581 |   11 | 0xc66002b7f48c0472
   34 |  71592 | 1209 | 0x0a33021dc4007363
   35 |  72801 | 1795 | 0xd0cc22ea708c921f
   36 |  74596 |  856 | 0x49e3007c9c2c5727
   37 |  75452 |   97 | 0xe0b422e3c40c89dc
   38 |  75549 | 1299 | 0xbd1806074024536a
   39 |  76848 |  131 | 0xd61104147c28928d
   40 |  76979 | 1987 | 0x31930627a080ebb0
   41 |  78966 | 11254 | 0x4c4400e65c24beff
   42 |  90220 |  868 | 0xa92400ca5ca02488
   43 |  91088 | 6279 | 0x5a3d0443f0a0d81a
   44 |  97367 |  969 | 0x7770042d140c7472
   45 |  98336 | 1664 | 0xe508202f55c46d2d`;

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
		process.exitCode = 1;
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

const input = generateTestInput().slice(0, 100);

let output = "";
for (let i = 0; i < input.length; i++) {
	output += input[i].toString(16).padStart(2, "0") + " ";
}

console.log("First 100 bytes", output);
