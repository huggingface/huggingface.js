import { describe, expect, it } from "vitest";
import { MerkleHashSubtree, fileHash, hashToHex, hexToBytes, verificationHash } from "@huggingface/xetchunk-wasm";
import type { MerkleHashSubtreeJson } from "@huggingface/xetchunk-wasm";
import {
	addToRangeEditCache,
	assignEditsToWindows,
	buildFreshFileCachePayload,
	buildRangeEditCachePayload,
	composeRepresentation,
	computeComposedFileHash,
	planRangeEditFromCache,
	snapAndCoalesceDirtyRanges,
	windowSegments,
} from "./rangeEdit";
import type { OriginalTerm, RangeEditCache, RangeEditPlan, RepresentationEntry } from "./rangeEdit";
import { SplicedBlob } from "./SplicedBlob";

interface TestChunk {
	hash: string;
	length: number;
}

/** Deterministic pseudo-random 32-byte hash from a seed (splitmix64-based). */
function chunkOf(seed: number, length: number): TestChunk {
	const bytes = new Uint8Array(32);
	const view = new DataView(bytes.buffer);
	let state = BigInt(seed) & 0xffffffffffffffffn;
	for (let i = 0; i < 4; i++) {
		state = (state + 0x9e3779b97f4a7c15n) & 0xffffffffffffffffn;
		let z = state;
		z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
		z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn;
		z ^= z >> 31n;
		view.setBigUint64(i * 8, z, true);
	}
	return { hash: hashToHex(bytes), length };
}

/** Stable chunk size for TARGET_CHUNK_SIZE=64KB: within [2*8KB, 128KB-8KB) */
const STABLE_SIZE = 20_000;
/** Unstable chunk size (>= max - min = 120KB) */
const UNSTABLE_SIZE = 125_000;

/**
 * TS mirror of the server's `ChunkWindowBuilder` (xetcas PR #987 / xet-core
 * `chunk_window_builder.rs`): computes windows, gap hash subtrees and per-stable-term
 * verification hashes for a synthetic original file. Used to simulate
 * `GET /v2/file-chunk-hashes` responses in tests.
 */
function buildServerResponse(
	chunks: TestChunk[],
	terms: OriginalTerm[],
	dirtyRanges: Array<[number, number]>,
): {
	windows: Array<{ start: number; end: number }>;
	hashRanges: Array<MerkleHashSubtreeJson | null>;
	gapVerification: string[];
} {
	const isStable = (size: number) => size >= 16_384 && size < 122_880;

	let dirtyIdx = 0;
	let inDirtyZone = false;
	let gapIsFirst = true;
	let cursor = 0;
	let gapChunks: TestChunk[] = [];
	const windows: Array<{ start: number; end: number }> = [];
	const hashRanges: Array<MerkleHashSubtreeJson | null> = [];
	let tailPrevSize: number | undefined;

	const toSubtree = (chunksIn: TestChunk[], atStart: boolean, atEnd: boolean): MerkleHashSubtreeJson | null => {
		const subtree = MerkleHashSubtree.fromChunks(
			atStart,
			chunksIn.map((c) => ({ hash: hexToBytes(c.hash), length: c.length })),
			atEnd,
		);
		return subtree.isEmpty ? null : subtree.toJSON();
	};

	const overlapsDirtyAt = (idx: number, byteStart: number, byteEnd: number) =>
		idx < dirtyRanges.length && byteEnd > dirtyRanges[idx][0] && byteStart < dirtyRanges[idx][1];
	const mergeAhead = (byteEnd: number) => {
		while (dirtyIdx + 1 < dirtyRanges.length && byteEnd > dirtyRanges[dirtyIdx + 1][0]) {
			dirtyIdx++;
		}
	};

	for (const chunk of chunks) {
		const byteStart = cursor;
		const byteEnd = cursor + chunk.length;
		const overlapsDirty = overlapsDirtyAt(dirtyIdx, byteStart, byteEnd);

		if (!inDirtyZone) {
			if (overlapsDirty) {
				hashRanges.push(toSubtree(gapChunks, gapIsFirst, false));
				gapChunks = [];
				windows.push({ start: cursor, end: byteEnd });
				mergeAhead(byteEnd);
				inDirtyZone = true;
				tailPrevSize = undefined;
			} else {
				gapChunks.push(chunk);
			}
		} else if (overlapsDirty || overlapsDirtyAt(dirtyIdx + 1, byteStart, byteEnd)) {
			if (!overlapsDirty) {
				dirtyIdx++;
			}
			windows[windows.length - 1].end = byteEnd;
			mergeAhead(byteEnd);
			tailPrevSize = undefined;
		} else {
			windows[windows.length - 1].end = byteEnd;
			const stable = tailPrevSize !== undefined && isStable(tailPrevSize) && isStable(chunk.length);
			tailPrevSize = chunk.length;
			if (stable) {
				dirtyIdx++;
				gapIsFirst = false;
				inDirtyZone = false;
				tailPrevSize = undefined;
			}
		}
		cursor = byteEnd;
	}

	hashRanges.push(toSubtree(gapChunks, gapIsFirst, true));

	// gap verification per stable term (fully outside every final window)
	const gapVerification: string[] = [];
	let acc = 0;
	let windowIdx = 0;
	let chunkIdx = 0;
	for (const term of terms) {
		const termStart = acc;
		const termEnd = acc + term.unpackedLength;
		acc = termEnd;
		const termChunkCount = term.range.end - term.range.start;
		const termChunks = chunks.slice(chunkIdx, chunkIdx + termChunkCount);
		chunkIdx += termChunkCount;
		while (windowIdx < windows.length && windows[windowIdx].end <= termStart) {
			windowIdx++;
		}
		const overlaps = windowIdx < windows.length && windows[windowIdx].start < termEnd;
		if (!overlaps) {
			gapVerification.push(hashToHex(verificationHash(termChunks.map((c) => hexToBytes(c.hash)))));
		}
	}

	return { windows, hashRanges, gapVerification };
}

/** Build a synthetic original file: `chunkCounts[i]` chunks per term, all in one xorb. */
function makeOriginal(chunkCounts: number[], chunkSize: (i: number) => number) {
	const chunks: TestChunk[] = [];
	const terms: OriginalTerm[] = [];
	const segByteStarts = [0];
	let chunkIdx = 0;
	for (const count of chunkCounts) {
		let termBytes = 0;
		const rangeStart = chunkIdx;
		for (let i = 0; i < count; i++) {
			const chunk = chunkOf(chunkIdx, chunkSize(chunkIdx));
			chunks.push(chunk);
			termBytes += chunk.length;
			chunkIdx++;
		}
		terms.push({
			hash: "a".repeat(64),
			unpackedLength: termBytes,
			range: { start: rangeStart, end: chunkIdx },
		});
		segByteStarts.push(segByteStarts[segByteStarts.length - 1] + termBytes);
	}
	return { chunks, terms, segByteStarts, size: segByteStarts[segByteStarts.length - 1] };
}

describe("rangeEdit", () => {
	describe("snapAndCoalesceDirtyRanges", () => {
		const segByteStarts = [0, 100, 250, 400, 500];

		it("snaps an edit to enclosing term boundaries", () => {
			expect(snapAndCoalesceDirtyRanges([{ start: 120, end: 130 }], segByteStarts, 500)).toEqual([[100, 250]]);
		});

		it("keeps already-aligned ranges", () => {
			expect(snapAndCoalesceDirtyRanges([{ start: 100, end: 250 }], segByteStarts, 500)).toEqual([[100, 250]]);
		});

		it("snaps a pure insert to the term containing it", () => {
			expect(snapAndCoalesceDirtyRanges([{ start: 120, end: 120 }], segByteStarts, 500)).toEqual([[100, 250]]);
		});

		it("snaps a pure insert on a boundary to the following term", () => {
			expect(snapAndCoalesceDirtyRanges([{ start: 250, end: 250 }], segByteStarts, 500)).toEqual([[250, 400]]);
		});

		it("snaps an append (insert at EOF) to the last term", () => {
			expect(snapAndCoalesceDirtyRanges([{ start: 500, end: 500 }], segByteStarts, 500)).toEqual([[400, 500]]);
		});

		it("coalesces overlapping/adjacent snapped ranges", () => {
			expect(
				snapAndCoalesceDirtyRanges(
					[
						{ start: 120, end: 130 },
						{ start: 200, end: 260 },
						{ start: 450, end: 460 },
					],
					segByteStarts,
					500,
				),
			).toEqual([[100, 500]]);
		});
	});

	describe("assignEditsToWindows", () => {
		const segByteStarts = [0, 100, 250, 400, 500];

		it("assigns edits to their windows and computes sizes", () => {
			const editA = { insert: new Blob(["x".repeat(20)]), start: 120, end: 130 };
			const editB = { insert: new Blob([]), start: 420, end: 450 };
			const windows = assignEditsToWindows(
				[
					{ start: 100, end: 250 },
					{ start: 400, end: 500 },
				],
				[editA, editB],
				500,
				segByteStarts,
			);
			expect(windows).toHaveLength(2);
			expect(windows[0].edits).toEqual([editA]);
			expect(windows[0].newSize).toBe(150 + 20 - 10);
			expect(windows[0].effectiveEnd).toBe(250);
			expect(windows[1].edits).toEqual([editB]);
			expect(windows[1].newSize).toBe(100 - 30);
		});

		it("extends a mid-term window end to the next term boundary", () => {
			const edit = { insert: new Blob(["y".repeat(10)]), start: 120, end: 130 };
			// Server extended the window past the requested [100, 250) to 300 (inside term [250, 400))
			const windows = assignEditsToWindows([{ start: 100, end: 300 }], [edit], 500, segByteStarts);
			expect(windows[0].end).toBe(300);
			expect(windows[0].effectiveEnd).toBe(400);
			expect(windows[0].newSize).toBe(300);
			expect(windows[0].hashSplitSize).toBe(200);
		});

		it("assigns an append to the last window only when it ends at EOF", () => {
			const append = { insert: new Blob(["z".repeat(50)]), start: 500, end: 500 };
			const windows = assignEditsToWindows([{ start: 400, end: 500 }], [append], 500, segByteStarts);
			expect(windows[0].edits).toEqual([append]);
			expect(windows[0].newSize).toBe(150);
		});

		it("throws when an edit is not assigned to any window", () => {
			expect(() =>
				assignEditsToWindows(
					[{ start: 0, end: 100 }],
					[{ insert: new Blob(["a"]), start: 300, end: 310 }],
					500,
					segByteStarts,
				),
			).toThrow();
		});
	});

	describe("windowSegments", () => {
		it("interleaves original slices and edit inserts up to effectiveEnd", async () => {
			const original = new Blob(["0123456789"]);
			const window = {
				start: 2,
				end: 6,
				effectiveEnd: 8,
				edits: [{ insert: new Blob(["AB"]), start: 4, end: 5 }],
				newSize: 7,
				hashSplitSize: 5,
			};
			const segments = windowSegments(window, original);
			const text = (await Promise.all(segments.map((segment) => segment.text()))).join("");
			expect(text).toBe("23AB567");
		});

		it("handles appends (insert at EOF)", async () => {
			const original = new Blob(["0123456789"]);
			const window = {
				start: 5,
				end: 10,
				effectiveEnd: 10,
				edits: [{ insert: new Blob(["APPEND"]), start: 10, end: 10 }],
				newSize: 11,
				hashSplitSize: 11,
			};
			const text = (await Promise.all(windowSegments(window, original).map((segment) => segment.text()))).join("");
			expect(text).toBe("56789APPEND");
		});
	});

	describe("end-to-end hash & representation composition", () => {
		/**
		 * Simulates the full flow against the mirrored server logic:
		 * 1. Build a synthetic original file (chunks split into terms).
		 * 2. Apply edits, get windows/gaps from the simulated server.
		 * 3. Simulate the client's re-chunking of each window.
		 * 4. Verify the composed hash equals `fileHash` of the final chunk list, and the
		 *    representation splices reused terms and window entries correctly.
		 */
		function run(opts: {
			chunkCounts: number[];
			chunkSize?: (i: number) => number;
			/** Replace original chunk indexes [start, end) with the given new chunks */
			edit: { chunkStart: number; chunkEnd: number; newChunks: TestChunk[] };
		}) {
			const { chunks, terms, segByteStarts, size } = makeOriginal(
				opts.chunkCounts,
				opts.chunkSize ?? (() => STABLE_SIZE),
			);

			// Byte range of the edited chunks
			const editStart = chunks.slice(0, opts.edit.chunkStart).reduce((sum, c) => sum + c.length, 0);
			const editEnd = chunks.slice(0, opts.edit.chunkEnd).reduce((sum, c) => sum + c.length, 0);
			const newBytes = opts.edit.newChunks.reduce((sum, c) => sum + c.length, 0);
			const edits = [{ insert: new Blob([new Uint8Array(newBytes)]), start: editStart, end: editEnd }];

			const dirtyRanges = snapAndCoalesceDirtyRanges(edits, segByteStarts, size);
			const server = buildServerResponse(chunks, terms, dirtyRanges);
			const windows = assignEditsToWindows(server.windows, edits, size, segByteStarts);

			const plan: RangeEditPlan = {
				originalHash: "f".repeat(64),
				originalSize: size,
				newSize: size - (editEnd - editStart) + newBytes,
				terms,
				segByteStarts,
				windows,
				hashRanges: server.hashRanges,
				gapVerification: server.gapVerification,
			};

			// Simulate the client's re-chunking of each window: original chunks are reproduced
			// outside the edited byte range (the chunker resets at chunk boundaries and provably
			// re-syncs by window.end), the edited region yields the new chunks.
			const finalChunks: TestChunk[] = [];
			const chunkStartBytes: number[] = [];
			let acc = 0;
			for (const chunk of chunks) {
				chunkStartBytes.push(acc);
				acc += chunk.length;
			}
			const windowChunks: TestChunk[][] = plan.windows.map((window) => {
				const result: TestChunk[] = [];
				for (let i = 0; i < chunks.length; i++) {
					const start = chunkStartBytes[i];
					if (start < window.start || start >= window.effectiveEnd) {
						continue;
					}
					if (start === editStart) {
						result.push(...opts.edit.newChunks);
					}
					if (start >= editStart && start < editEnd) {
						continue; // replaced
					}
					result.push(chunks[i]);
				}
				return result;
			});

			// Final full chunk list (for the ground-truth hash)
			for (let i = 0; i < chunks.length; i++) {
				if (chunkStartBytes[i] === editStart) {
					finalChunks.push(...opts.edit.newChunks);
				}
				if (chunkStartBytes[i] >= editStart && chunkStartBytes[i] < editEnd) {
					continue;
				}
				finalChunks.push(chunks[i]);
			}

			const expectedHash = hashToHex(
				fileHash(finalChunks.map((chunk) => ({ hash: hexToBytes(chunk.hash), length: chunk.length }))),
			);
			const composedHash = computeComposedFileHash(plan, windowChunks);
			expect(composedHash).toBe(expectedHash);

			// Representation: fake one rep entry per window, check term splicing
			const windowReps = windowChunks.map((wc, i) => [
				{
					xorbId: i,
					indexStart: 0,
					indexEnd: wc.length,
					length: wc.reduce((sum, c) => sum + c.length, 0),
					rangeHash: "b".repeat(64),
				},
			]);
			const representation = composeRepresentation(plan, windowReps);

			return { plan, representation, windows, server };
		}

		it("mid-file edit with stable chunks (window extends past the requested term)", () => {
			// 5 terms x 4 stable chunks; edit chunks 6-7 (term 1)
			const { plan, representation, windows } = run({
				chunkCounts: [4, 4, 4, 4, 4],
				edit: { chunkStart: 6, chunkEnd: 7, newChunks: [chunkOf(1000, 17_000), chunkOf(1001, 21_000)] },
			});

			// Server extends the window 2 chunks past the requested [term1] range → mid-term 2
			expect(windows).toHaveLength(1);
			expect(windows[0].end).toBeGreaterThan(plan.segByteStarts[2]);
			expect(windows[0].end).toBeLessThan(plan.segByteStarts[3]);
			expect(windows[0].effectiveEnd).toBe(plan.segByteStarts[3]);

			// Representation: term 0 reused, window rep, terms 3..4 reused
			expect(representation).toHaveLength(4);
			expect(representation[0].indexStart).toBe(0);
			expect(representation[0].indexEnd).toBe(4);
			expect(representation[0].rangeHash).toBe(plan.gapVerification[0]);
			expect(representation[1].xorbId).toBe(0); // the window rep
			expect(representation[2].indexStart).toBe(12);
			expect(representation[3].indexEnd).toBe(20);
			expect(plan.gapVerification).toHaveLength(3);
		});

		it("edit at the start of the file", () => {
			const { representation, windows, plan } = run({
				chunkCounts: [4, 4, 4],
				edit: { chunkStart: 0, chunkEnd: 2, newChunks: [chunkOf(2000, 30_000)] },
			});
			expect(windows[0].start).toBe(0);
			expect(representation[0].xorbId).toBe(0);
			expect(plan.hashRanges[0]).toBeNull();
		});

		it("edit of the last term (window ends at EOF, no extension)", () => {
			const { windows, representation, plan } = run({
				chunkCounts: [4, 4, 4],
				edit: { chunkStart: 10, chunkEnd: 12, newChunks: [chunkOf(3000, 40_000)] },
			});
			expect(windows[0].end).toBe(plan.originalSize);
			expect(windows[0].effectiveEnd).toBe(plan.originalSize);
			expect(plan.hashRanges[plan.hashRanges.length - 1]).toBeNull();
			expect(representation).toHaveLength(3); // terms 0,1 reused + window
		});

		it("append (new chunks after the last original chunk)", () => {
			const { chunks, terms, segByteStarts, size } = makeOriginal([4, 4], () => STABLE_SIZE);
			const appended = [chunkOf(4000, 25_000), chunkOf(4001, 33_000)];
			const appendBytes = appended.reduce((sum, c) => sum + c.length, 0);
			const edits = [{ insert: new Blob([new Uint8Array(appendBytes)]), start: size, end: size }];

			const dirtyRanges = snapAndCoalesceDirtyRanges(edits, segByteStarts, size);
			expect(dirtyRanges).toEqual([[segByteStarts[1], size]]);
			const server = buildServerResponse(chunks, terms, dirtyRanges);
			const windows = assignEditsToWindows(server.windows, edits, size, segByteStarts);
			expect(windows[0].end).toBe(size);

			const plan: RangeEditPlan = {
				originalHash: "f".repeat(64),
				originalSize: size,
				newSize: size + appendBytes,
				terms,
				segByteStarts,
				windows,
				hashRanges: server.hashRanges,
				gapVerification: server.gapVerification,
			};

			// Window re-chunks term 1's chunks + the appended chunks
			const windowChunks = [[...chunks.slice(4), ...appended]];
			const finalChunks = [...chunks, ...appended];
			const expectedHash = hashToHex(
				fileHash(finalChunks.map((chunk) => ({ hash: hexToBytes(chunk.hash), length: chunk.length }))),
			);
			expect(computeComposedFileHash(plan, windowChunks)).toBe(expectedHash);

			const representation = composeRepresentation(plan, [
				[
					{
						xorbId: 0,
						indexStart: 0,
						indexEnd: 6,
						length: windowChunks[0].reduce((sum, c) => sum + c.length, 0),
						rangeHash: "b".repeat(64),
					},
				],
			]);
			expect(representation).toHaveLength(2);
			expect(representation[0].xorbId).toBe(terms[0].hash);
			expect(representation[0].rangeHash).toBe(plan.gapVerification[0]);
		});

		it("edit with unstable following chunks (window extends to EOF)", () => {
			const { windows, plan, representation } = run({
				chunkCounts: [3, 3, 3],
				chunkSize: () => UNSTABLE_SIZE,
				edit: { chunkStart: 3, chunkEnd: 4, newChunks: [chunkOf(5000, 50_000)] },
			});
			// No stable pair after the dirty zone → extension runs to EOF
			expect(windows[0].end).toBe(plan.originalSize);
			expect(representation).toHaveLength(2); // term 0 reused + window
			expect(plan.gapVerification).toHaveLength(1);
		});

		it("cached appends: plan synthesized without API data matches ground truth across rounds", () => {
			// Fresh file: 10 chunks in two terms ([0..6) xorb A, [6..10) xorb B)
			const fileChunks = Array.from({ length: 10 }, (_, i) => chunkOf(100 + i, STABLE_SIZE));
			const rangeHashOf = (chunks: TestChunk[]) => hashToHex(verificationHash(chunks.map((c) => hexToBytes(c.hash))));
			let representation: RepresentationEntry[] = [
				{
					xorbId: "a".repeat(64),
					indexStart: 0,
					indexEnd: 6,
					length: 6 * STABLE_SIZE,
					rangeHash: rangeHashOf(fileChunks.slice(0, 6)),
				},
				{
					xorbId: "c".repeat(64),
					indexStart: 0,
					indexEnd: 4,
					length: 4 * STABLE_SIZE,
					rangeHash: rangeHashOf(fileChunks.slice(6)),
				},
			];

			const cache: RangeEditCache = new Map();
			let payload = buildFreshFileCachePayload(fileChunks, representation);
			expect(payload).toBeDefined();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(payload?.lastTermChunks).toEqual(fileChunks.slice(6));

			let currentChunks = [...fileChunks];
			let currentHash = "e".repeat(64);
			let size = currentChunks.reduce((sum, c) => sum + c.length, 0);

			const storeCacheEntry = () => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const p = payload!;
				addToRangeEditCache(cache, currentHash, {
					size: p.size,
					terms: representation.map((rep) => ({
						hash: rep.xorbId as string,
						unpackedLength: rep.length,
						range: { start: rep.indexStart, end: rep.indexEnd },
						rangeHash: rep.rangeHash,
					})),
					openSubtree: p.openSubtree,
					lastTermChunks: p.lastTermChunks,
				});
			};
			storeCacheEntry();

			for (let round = 0; round < 3; round++) {
				// Append: re-chunking the last term + appended data merges the term's last chunk
				// (previously cut by finalize) with the appended bytes into fresh chunks.
				const appendBytes = 36_000;
				const lastTermChunkCount =
					representation[representation.length - 1].indexEnd - representation[representation.length - 1].indexStart;
				const lastTerm = currentChunks.slice(currentChunks.length - lastTermChunkCount);
				const lastChunkLength = lastTerm[lastTerm.length - 1].length;
				const newTailChunks = [
					chunkOf(500 + round * 10, 25_000),
					chunkOf(501 + round * 10, lastChunkLength + appendBytes - 25_000),
				];
				const spliced = SplicedBlob.create(new Blob([new Uint8Array(size)]), [
					{ insert: new Blob([new Uint8Array(appendBytes)]), start: size, end: size },
				]);

				const plan = planRangeEditFromCache(spliced, currentHash, size, cache);
				expect(plan).toBeDefined();
				if (!plan) {
					throw new Error("unreachable");
				}
				expect(plan.windows).toHaveLength(1);
				expect(plan.newSize).toBe(size + appendBytes);

				const windowChunks = [...lastTerm.slice(0, -1), ...newTailChunks];
				const nextChunks = [...currentChunks.slice(0, currentChunks.length - lastTermChunkCount), ...windowChunks];
				const newSize = nextChunks.reduce((sum, c) => sum + c.length, 0);
				expect(newSize).toBe(size + appendBytes);

				const expected = hashToHex(fileHash(nextChunks.map((c) => ({ hash: hexToBytes(c.hash), length: c.length }))));
				expect(computeComposedFileHash(plan, [windowChunks])).toBe(expected);

				// Representation: all terms except the last are reused via their cached rangeHashes
				const windowRep = [
					{
						xorbId: `${round}`.repeat(64).slice(0, 64),
						indexStart: 0,
						indexEnd: windowChunks.length,
						length: windowChunks.reduce((sum, c) => sum + c.length, 0),
						rangeHash: rangeHashOf(windowChunks),
					},
				];
				const composed = composeRepresentation(plan, [windowRep]);
				expect(composed).toHaveLength(representation.length);
				expect(composed.slice(0, -1)).toEqual(
					representation.slice(0, -1).map((rep) => ({
						xorbId: rep.xorbId,
						indexStart: rep.indexStart,
						indexEnd: rep.indexEnd,
						length: rep.length,
						rangeHash: rep.rangeHash,
					})),
				);

				// Next round: cache from this round's payload
				payload = buildRangeEditCachePayload(plan, [windowChunks], composed);
				expect(payload).toBeDefined();
				representation = composed;
				currentChunks = nextChunks;
				currentHash = expected + round; // any unique key
				size = newSize;
				storeCacheEntry();
			}
		});

		it("throws when window chunks do not re-sync at the hash split point", () => {
			const { chunks, terms, segByteStarts, size } = makeOriginal([4, 4, 4], () => STABLE_SIZE);
			const edits = [{ insert: new Blob([new Uint8Array(100)]), start: 0, end: 100 }];
			const dirtyRanges = snapAndCoalesceDirtyRanges(edits, segByteStarts, size);
			const server = buildServerResponse(chunks, terms, dirtyRanges);
			const windows = assignEditsToWindows(server.windows, edits, size, segByteStarts);
			const plan: RangeEditPlan = {
				originalHash: "f".repeat(64),
				originalSize: size,
				newSize: size,
				terms,
				segByteStarts,
				windows,
				hashRanges: server.hashRanges,
				gapVerification: server.gapVerification,
			};
			// One big chunk covering the whole window: no boundary at the split point
			expect(() => computeComposedFileHash(plan, [[chunkOf(6000, windows[0].newSize)]])).toThrow(/re-sync/);
		});
	});
});
