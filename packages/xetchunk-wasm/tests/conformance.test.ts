import { beforeAll, describe, expect, it } from "vitest";
import {
	Chunker as RustChunker,
	init as initRustChunker,
	XET_CORE_COMMIT,
	XET_CORE_WASM_SHA256,
} from "../../hub/src/vendor/xet-chunk/chunker_wasm.js";
import { createChunker, finalize, getChunks, hashToHex, nextBlock } from "../src/index.js";

interface ComparableChunk {
	hash: string;
	length: number;
}

interface DataCase {
	name: string;
	size: number;
	fill(data: Uint8Array): void;
}

const KIB = 1024;
const MIB = 1024 * KIB;

function fillXorshift32(data: Uint8Array, seed: number): void {
	let state = seed | 0;
	for (let i = 0; i < data.length; i++) {
		state ^= state << 13;
		state ^= state >>> 17;
		state ^= state << 5;
		data[i] = state & 0xff;
	}
}

function makeData(testCase: DataCase): Uint8Array {
	const data = new Uint8Array(testCase.size);
	testCase.fill(data);
	return data;
}

function feed(data: Uint8Array, feedSizes: readonly number[], addData: (block: Uint8Array) => void): void {
	let offset = 0;
	let feedIndex = 0;
	while (offset < data.length) {
		const size = feedSizes[feedIndex % feedSizes.length];
		const end = Math.min(offset + size, data.length);
		addData(data.subarray(offset, end));
		offset = end;
		feedIndex++;
	}
}

function chunkWithJs(data: Uint8Array, target: number, feedSizes?: readonly number[]): ComparableChunk[] {
	if (!feedSizes) {
		return getChunks(data, target).map(({ hash, length }) => ({ hash: hashToHex(hash), length }));
	}

	const chunker = createChunker(target);
	const chunks: ComparableChunk[] = [];
	feed(data, feedSizes, (block) => {
		chunks.push(...nextBlock(chunker, block).map(({ hash, length }) => ({ hash: hashToHex(hash), length })));
	});
	const finalChunk = finalize(chunker);
	if (finalChunk) {
		chunks.push({ hash: hashToHex(finalChunk.hash), length: finalChunk.length });
	}
	return chunks;
}

function chunkWithRust(data: Uint8Array, target: number, feedSizes?: readonly number[]): ComparableChunk[] {
	const chunker = new RustChunker(target);
	const chunks: ComparableChunk[] = [];
	try {
		feed(data, feedSizes ?? [Math.max(1, data.length)], (block) => {
			chunks.push(...chunker.add_data(block).map(({ hash, length }) => ({ hash, length })));
		});
		chunks.push(...chunker.finish().map(({ hash, length }) => ({ hash, length })));
		return chunks;
	} finally {
		chunker.free();
	}
}

function expectConformance(data: Uint8Array, target: number, feedSizes?: readonly number[]): void {
	const jsChunks = chunkWithJs(data, target, feedSizes);
	const rustChunks = chunkWithRust(data, target, feedSizes);
	// Equal lengths establish identical byte ranges; equal hashes verify the
	// content of each range against xet-core's keyed BLAKE3 output.
	expect(jsChunks).toEqual(rustChunks);
	expect(jsChunks.reduce((total, chunk) => total + chunk.length, 0)).toBe(data.length);
}

const contentCases: DataCase[] = [
	{ name: "zeros", size: 2 * MIB + 17, fill: () => {} },
	{ name: "constant", size: MIB + 333, fill: (data) => data.fill(59) },
	{ name: "all-ones", size: MIB + 777, fill: (data) => data.fill(0xff) },
	{
		name: "incrementing",
		size: 2 * MIB + 123,
		fill: (data) => {
			for (let i = 0; i < data.length; i++) {
				data[i] = i & 0xff;
			}
		},
	},
	{
		name: "alternating",
		size: MIB + 511,
		fill: (data) => {
			for (let i = 0; i < data.length; i++) {
				data[i] = i % 2 === 0 ? 0xaa : 0x55;
			}
		},
	},
	{
		name: "sparse",
		size: 2 * MIB + 65,
		fill: (data) => {
			for (let i = 0; i < data.length; i += 4093) {
				data[i] = (i / 4093) & 0xff;
			}
		},
	},
	{
		name: "text",
		size: 2 * MIB + 1009,
		fill: (data) => {
			const text = new TextEncoder().encode("The quick brown fox jumps over the lazy dog. Content-defined chunking. ");
			for (let i = 0; i < data.length; i++) {
				data[i] = text[i % text.length];
			}
		},
	},
	{ name: "random-seed-1", size: 2 * MIB + 31, fill: (data) => fillXorshift32(data, 1) },
	{ name: "random-seed-2", size: 2 * MIB + 63, fill: (data) => fillXorshift32(data, 0x12345678) },
	{ name: "minimum-boundary-regression", size: 3 * MIB, fill: (data) => fillXorshift32(data, 0x9e3779b9) },
];

describe("xet-core chunker conformance", () => {
	beforeAll(async () => {
		await initRustChunker();
	});

	it("identifies the xet-core reference commit", () => {
		expect(XET_CORE_COMMIT).toBe("861056a363e4e5e8661a7d8ecb22b923e54355a0");
		expect(XET_CORE_WASM_SHA256).toBe("596067aba4a866832fc5d5c9f577cb6e82514b8d5b4f11cee1aedacab5aa439e");
	});

	describe("content distributions and target sizes", () => {
		for (const testCase of contentCases) {
			for (const target of [8 * KIB, 64 * KIB, MIB]) {
				it(`${testCase.name}, target=${target}`, () => {
					const data = makeData(testCase);
					expectConformance(data, target);
				});
			}
		}
	});

	describe("input boundaries", () => {
		const edgeSizes = [0, 1, 63, 64, 65, 8191, 8192, 8193, 65535, 65536, 65537, 131071, 131072, 131073];
		for (const size of edgeSizes) {
			it(`size=${size}`, () => {
				const data = new Uint8Array(size);
				fillXorshift32(data, 0x6d2b79f5);
				expectConformance(data, 64 * KIB, [1, 63, 64, 65, 8191]);
			});
		}
	});

	describe("streaming feed sizes", () => {
		const streamingCases = contentCases.filter(({ name }) =>
			["text", "random-seed-1", "minimum-boundary-regression"].includes(name),
		);
		const feeds = [
			{ name: "tiny", sizes: [37] },
			{ name: "window-adjacent", sizes: [63, 64, 65] },
			{ name: "minimum-adjacent", sizes: [8191, 8192, 8193] },
			{ name: "irregular", sizes: [1, 4093, 65521, 17, 1024 * KIB] },
			{ name: "1MiB", sizes: [MIB] },
		];

		for (const testCase of streamingCases) {
			for (const feedCase of feeds) {
				it(`${testCase.name}, feed=${feedCase.name}`, () => {
					const data = makeData(testCase);
					expectConformance(data, 64 * KIB, feedCase.sizes);
				});
			}
		}
	});
});
