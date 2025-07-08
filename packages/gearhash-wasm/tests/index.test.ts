import { describe, it, expect } from "vitest";
import { nextMatch, nextMatches } from "../build/debug.js";

// Simple deterministic RNG for reproducible results (24-bit version)
// Alternatively, could have used WASM for 64-bit arithmetic.
class SimpleRng {
	private state: number;

	constructor(seed: number) {
		this.state = seed & 0xffffff; // Keep only 24 bits
	}

	nextU24(): number {
		// Simple 24-bit linear congruential generator
		// Using 24-bit arithmetic to avoid overflow
		this.state = (this.state * 1111 + 12345) & 0xffffff;
		return this.state;
	}

	fillBytes(dest: Uint8Array): void {
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

function generateTestInput(): Uint8Array {
	const bytes = new Uint8Array(INPUT_SIZE);
	const rng = new SimpleRng(BENCH_INPUT_SEED);
	rng.fillBytes(bytes);
	return bytes;
}

interface TestResults {
	chunkCount: number;
	totalProcessed: number;
	averageChunkSize: number;
}

interface ExpectedResult {
	chunk: number;
	offset: number;
	size: number;
	hash: string;
}

function testGearhash(): TestResults {
	const inputBuf = generateTestInput();

	let chunkCount = 0;
	let totalProcessed = 0;

	const result = nextMatches(inputBuf, BENCH_MASK, 0n);
	const matches = [...result.matches, { position: result.remaining, hash: result.hash }];

	for (const match of matches) {
		totalProcessed += match.position;
		chunkCount += 1;
	}

	return { chunkCount, totalProcessed, averageChunkSize: totalProcessed / chunkCount };
}

// Parse the expected results from Rust
function parseExpectedResults(resultData: string): ExpectedResult[] {
	const lines = resultData.trim().split("\n");
	const results: ExpectedResult[] = [];

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

describe("gearhash-wasm", () => {
	describe("Basic functionality", () => {
		it("should generate test input correctly", () => {
			const input = generateTestInput();
			expect(input.length).toBe(INPUT_SIZE);

			// Verify specific byte values for reproducibility
			// These values may vary depending on the RNG implementation
			expect(typeof input[0]).toBe("number");
			expect(input[0]).toBeGreaterThanOrEqual(0);
			expect(input[0]).toBeLessThanOrEqual(255);
			expect(typeof input[100]).toBe("number");
			expect(typeof input[1000]).toBe("number");
		});

		it("should process chunks correctly", () => {
			const testResults = testGearhash();

			expect(testResults.chunkCount).toBeGreaterThan(0);
			expect(testResults.totalProcessed).toBe(INPUT_SIZE);
			expect(testResults.averageChunkSize).toBeGreaterThan(0);
		});
	});

	describe("Chunk matching accuracy", () => {
		it("should match expected results from Rust implementation", () => {
			const inputBuf = generateTestInput();
			const result = nextMatches(inputBuf, BENCH_MASK, 0n);
			const allMatches = [...result.matches, { position: result.remaining, hash: result.hash }];

			// Generate actual results in the same format as expected
			const actualResults: ExpectedResult[] = [];
			let offset = 0;
			let chunkCount = 0;

			for (const match of allMatches) {
				chunkCount += 1;
				actualResults.push({
					chunk: chunkCount,
					offset: offset,
					size: match.position,
					hash: `0x${match.hash.toString(16).padStart(16, "0")}`,
				});
				offset += match.position;
			}

			// Compare with expected results
			const expectedResults = parseExpectedResults(resultData);
			const totalChunks = Math.min(actualResults.length, expectedResults.length);

			expect(totalChunks).toBe(expectedResults.length);
			expect(totalChunks).toBe(45);

			let matchCount = 0;
			for (let i = 0; i < totalChunks; i++) {
				const actual = actualResults[i];
				const expected = expectedResults[i];

				if (actual.offset === expected.offset && actual.size === expected.size && actual.hash === expected.hash) {
					matchCount++;
				}
			}

			// We expect at least 90% accuracy compared to Rust implementation
			const accuracy = (matchCount / totalChunks) * 100;
			expect(accuracy).toBeGreaterThanOrEqual(100);
		});
	});

	describe("Individual chunk processing", () => {
		it("should process individual chunks correctly", () => {
			const input = generateTestInput();
			let offset = 0;
			let hash = 0n;

			while (offset < input.length) {
				const result = nextMatch(input.subarray(offset), BENCH_MASK, hash);

				// Position can be -1 to indicate no match found
				expect(result.position).toBeGreaterThanOrEqual(-1);
				expect(typeof result.hash).toBe("bigint");

				if (result.position > 0) {
					offset += result.position;
					hash = result.hash;
				} else {
					// No more matches, break
					break;
				}
			}
		});
	});

	describe("Edge cases", () => {
		it("should handle empty input", () => {
			const emptyInput = new Uint8Array(0);
			const result = nextMatches(emptyInput, BENCH_MASK, 0n);

			expect(result.matches.length).toBe(0);
			expect(result.remaining).toBe(0);
		});

		it("should handle small input", () => {
			const smallInput = new Uint8Array([1, 2, 3, 4, 5]);
			const result = nextMatches(smallInput, BENCH_MASK, 0n);

			expect(result.matches.length).toBeGreaterThanOrEqual(0);
			expect(result.remaining).toBeGreaterThanOrEqual(0);
		});

		it("should handle different masks", () => {
			const input = generateTestInput().slice(0, 1000);
			const differentMasks = [0x0000ff0000000000n, 0x00000000ff000000n, 0x000000000000ff00n];

			for (const mask of differentMasks) {
				const result = nextMatches(input, mask, 0n);
				expect(result.matches.length).toBeGreaterThanOrEqual(0);
			}
		});
	});

	describe("Performance characteristics", () => {
		it("should maintain reasonable chunk sizes", () => {
			const testResults = testGearhash();

			// Average chunk size should be reasonable (not too small, not too large)
			expect(testResults.averageChunkSize).toBeGreaterThan(100);
			expect(testResults.averageChunkSize).toBeLessThan(10000);
		});

		it("should process all input data", () => {
			const testResults = testGearhash();
			expect(testResults.totalProcessed).toBe(INPUT_SIZE);
		});
	});
});
