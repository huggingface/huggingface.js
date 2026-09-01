import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Hasher } from "@huggingface/blake3-jit";
import { MerkleHashSubtree, hashToHex, xorbHash, fileHash } from "../src/index.js";
import type { Chunk, MerkleHashSubtreeJson } from "../src/index.js";

/** Same DATA_KEY as Rust's `compute_data_hash` / the chunker's BLAKE3_DATA_KEY. */
const BLAKE3_DATA_KEY = new Uint8Array([
	102, 151, 245, 119, 91, 149, 80, 222, 49, 53, 203, 172, 165, 151, 24, 28, 157, 228, 33, 16, 155, 235, 43, 88, 180,
	208, 176, 75, 147, 173, 242, 41,
]);

const dataHasher = Hasher.newKeyed(BLAKE3_DATA_KEY);

/** Mirror of the fixture generator: chunk(i) = (compute_data_hash(le_bytes(i)), 100 + (i*37) % 1000) */
function fixtureChunk(i: number): Chunk {
	const bytes = new Uint8Array(8);
	new DataView(bytes.buffer).setBigUint64(0, BigInt(i), true);
	return {
		hash: dataHasher.reset().update(bytes).finalize(32),
		length: 100 + ((i * 37) % 1000),
	};
}

function fixtureChunks(n: number): Chunk[] {
	return Array.from({ length: n }, (_, i) => fixtureChunk(i));
}

interface Fixture {
	description: string;
	cases: Array<{
		n: number;
		full: MerkleHashSubtreeJson;
		finalHash: string;
		xorbHash: string;
		fileHash: string;
		splits: Array<{
			points: number[];
			parts: MerkleHashSubtreeJson[];
			mergedFinalHash: string;
		}>;
	}>;
}

const fixture: Fixture = JSON.parse(
	readFileSync(join(dirname(fileURLToPath(import.meta.url)), "subtree-fixture.json"), "utf8"),
);

describe("MerkleHashSubtree", () => {
	describe("Rust reference fixture", () => {
		for (const testCase of fixture.cases) {
			it(`matches Rust for n=${testCase.n}`, () => {
				const chunks = fixtureChunks(testCase.n);

				// Sanity check that our chunk derivation matches xorbHash/fileHash reference
				expect(hashToHex(xorbHash(chunks))).toBe(testCase.xorbHash);
				expect(hashToHex(fileHash(chunks))).toBe(testCase.fileHash);

				// Full closed subtree: serde-compatible JSON + final hash
				const full = MerkleHashSubtree.fromChunks(true, chunks, true);
				expect(full.toJSON()).toEqual(testCase.full);
				const finalHash = full.finalHash();
				expect(finalHash).toBeDefined();
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				expect(hashToHex(finalHash!)).toBe(testCase.finalHash);

				for (const split of testCase.splits) {
					const bounds = [0, ...split.points, testCase.n];

					// Build each part in TS and compare against Rust's serialization
					const tsParts: MerkleHashSubtree[] = [];
					for (let i = 0; i + 1 < bounds.length; i++) {
						const part = MerkleHashSubtree.fromChunks(
							bounds[i] === 0,
							chunks.slice(bounds[i], bounds[i + 1]),
							bounds[i + 1] === testCase.n,
						);
						expect(part.toJSON()).toEqual(split.parts[i]);
						tsParts.push(part);
					}

					// Merge TS-built parts
					const merged = MerkleHashSubtree.merge(tsParts);
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					expect(hashToHex(merged.finalHash()!)).toBe(split.mergedFinalHash);

					// Merge parts deserialized from Rust JSON (simulates server-provided hashRanges)
					const rustParts = split.parts.map((json) => MerkleHashSubtree.fromJSON(json));
					const mergedFromRust = MerkleHashSubtree.merge(rustParts);
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					expect(hashToHex(mergedFromRust.finalHash()!)).toBe(split.mergedFinalHash);

					// Mixed: alternate TS-built / Rust-deserialized parts
					const mixed = tsParts.map((part, i) => (i % 2 === 0 ? part : rustParts[i]));
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					expect(hashToHex(MerkleHashSubtree.merge(mixed).finalHash()!)).toBe(split.mergedFinalHash);
				}
			});
		}
	});

	describe("properties", () => {
		/** Simple deterministic PRNG (mulberry32) for reproducible property tests. */
		function prng(seed: number): () => number {
			let state = seed >>> 0;
			return () => {
				state = (state + 0x6d2b79f5) >>> 0;
				let t = state;
				t = Math.imul(t ^ (t >>> 15), t | 1);
				t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
				return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
			};
		}

		function randomChunks(rand: () => number, n: number): Chunk[] {
			return Array.from({ length: n }, () => {
				const bytes = new Uint8Array(8);
				new DataView(bytes.buffer).setBigUint64(0, BigInt(Math.floor(rand() * Number.MAX_SAFE_INTEGER)), true);
				return {
					hash: dataHasher.reset().update(bytes).finalize(32),
					length: 100 + Math.floor(rand() * 9900),
				};
			});
		}

		it("merging arbitrary partitions equals xorbHash of the whole", () => {
			const rand = prng(42);
			for (let iter = 0; iter < 30; iter++) {
				const n = 1 + Math.floor(rand() * 2000);
				const chunks = randomChunks(rand, n);
				const expected = hashToHex(xorbHash(chunks));

				// Random partition into up to 8 parts
				const numCuts = Math.floor(rand() * 7);
				const cuts = Array.from({ length: numCuts }, () => 1 + Math.floor(rand() * (n - 1))).sort((a, b) => a - b);
				const bounds = [0, ...new Set(cuts), n];

				const parts = [];
				for (let i = 0; i + 1 < bounds.length; i++) {
					parts.push(
						MerkleHashSubtree.fromChunks(bounds[i] === 0, chunks.slice(bounds[i], bounds[i + 1]), bounds[i + 1] === n),
					);
				}
				const merged = MerkleHashSubtree.merge(parts);
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				expect(hashToHex(merged.finalHash()!)).toBe(expected);
			}
		});

		it("streaming append: incremental merges match xorbHash", () => {
			const rand = prng(1337);
			const chunks = randomChunks(rand, 5000);

			// Simulates an append session: keep a running subtree, append in batches
			const running = MerkleHashSubtree.fromChunks(true, chunks.slice(0, 100), false);
			let pos = 100;
			while (pos < chunks.length) {
				const batchSize = 1 + Math.floor(rand() * 400);
				const end = Math.min(pos + batchSize, chunks.length);
				running.mergeInto(MerkleHashSubtree.fromChunks(false, chunks.slice(pos, end), end === chunks.length));
				pos = end;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(hashToHex(running.finalHash()!)).toBe(hashToHex(xorbHash(chunks)));

			// O(log n) storage
			expect(running.numNodes).toBeLessThan(1000);
		});

		it("JSON round-trip preserves merge behavior", () => {
			const rand = prng(7);
			const chunks = randomChunks(rand, 800);
			const a = MerkleHashSubtree.fromChunks(true, chunks.slice(0, 300), false);
			const b = MerkleHashSubtree.fromChunks(false, chunks.slice(300), true);

			const a2 = MerkleHashSubtree.fromJSON(JSON.parse(JSON.stringify(a.toJSON())));
			const b2 = MerkleHashSubtree.fromJSON(JSON.parse(JSON.stringify(b.toJSON())));

			expect(a2.toJSON()).toEqual(a.toJSON());

			a2.mergeInto(b2);
			a.mergeInto(b);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(hashToHex(a2.finalHash()!)).toBe(hashToHex(a.finalHash()!));
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(hashToHex(a.finalHash()!)).toBe(hashToHex(xorbHash(chunks)));
		});

		it("rejects invalid merges", () => {
			const chunks = randomChunks(prng(9), 50);
			const closed = MerkleHashSubtree.fromChunks(true, chunks, true);
			const open = MerkleHashSubtree.fromChunks(false, chunks, false);
			const atStart = MerkleHashSubtree.fromChunks(true, chunks, false);

			expect(() => closed.mergeInto(open)).toThrow();
			expect(() => atStart.clone().mergeInto(atStart)).toThrow();
			expect(open.finalHash()).toBeUndefined();
		});

		it("empty merge returns the zero hash", () => {
			const merged = MerkleHashSubtree.merge([]);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(hashToHex(merged.finalHash()!)).toBe("0".repeat(64));
		});

		it("totalLength sums covered bytes", () => {
			const chunks = randomChunks(prng(3), 500);
			const expected = chunks.reduce((sum, c) => sum + c.length, 0);
			expect(MerkleHashSubtree.fromChunks(true, chunks, true).totalLength).toBe(expected);
			expect(MerkleHashSubtree.fromChunks(false, chunks, false).totalLength).toBe(expected);
		});
	});
});
