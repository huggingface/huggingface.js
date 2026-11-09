import type { Chunk } from "./xet-chunker.js";
import { hashToHex, hexToBytes } from "./xet-chunker.js";
import { isNaturalCut, mergedHashOfSequence } from "./xorb-hash.js";

/**
 * TypeScript port of Rust's `MerkleHashSubtree`
 * (xet-core: `xet_core_structures/src/merklehash/merkle_hash_subtree.rs`).
 *
 * Compact representation of a contiguous range of chunk hashes with O(log n)
 * storage — a "hump" of partially-aggregated merkle nodes. Adjacent ranges can
 * be merged without reconstructing the full chunk list, and once a subtree
 * covers the whole file (`atStart && atEnd`), `finalHash()` equals
 * `aggregated_node_hash(all_chunks)` (i.e. the xorb hash of the chunk list;
 * apply `hmac(hash, zeroKey)` to get the file hash).
 *
 * The JSON form (`toJSON`/`fromJSON`) is byte-compatible with serde's
 * human-readable serialization, which is what the CAS server returns in
 * `GET /v2/file-chunk-hashes` responses (`hashRanges` entries):
 *
 * ```json
 * {
 *   "nodes": [{ "hash": "<64 hex chars>", "size": 123 }],
 *   "levels": [[leftCount, rightCount]],
 *   "at_start": true,
 *   "at_end": false
 * }
 * ```
 */

/** A node of the aggregation tree: at level 0 a chunk, above that a merged group. */
export type SubtreeNode = Chunk;

/** Serde-compatible JSON shape (human-readable form). */
export interface MerkleHashSubtreeJson {
	nodes: Array<{ hash: string; size: number }>;
	levels: Array<[number, number]>;
	at_start: boolean;
	at_end: boolean;
}

/** Groups always have at least 2 nodes. */
const MIN_GROUP_SIZE = 2;
/** Groups have at most 2*BF+1 = 9 nodes. */
const MAX_GROUP_SIZE = 9;

/**
 * Find the next cut point in a sequence of nodes at which to break,
 * mirroring Rust's `next_merge_cut`. Returns the group length starting at
 * `start` within `nodes` (bounded by `end`, exclusive).
 */
function nextMergeCut(nodes: SubtreeNode[], start: number, end: number): number {
	const len = end - start;
	if (len <= MIN_GROUP_SIZE) {
		return len;
	}

	const lim = Math.min(MAX_GROUP_SIZE, len);
	for (let i = MIN_GROUP_SIZE; i < lim; i++) {
		if (isNaturalCut(nodes[start + i].hash)) {
			return i + 1;
		}
	}

	return lim;
}

function validGap(gap: number): boolean {
	return gap > MIN_GROUP_SIZE && gap < MAX_GROUP_SIZE - 1;
}

/**
 * Find the first stable group boundary scanning left-to-right.
 *
 * A position `m` is "stable" if it is always a group boundary regardless of
 * what nodes precede this slice: three consecutive natural-cut positions
 * `c0 < c1 < c2` with both gaps in `(MIN_GROUP_SIZE, MAX_GROUP_SIZE - 1)`
 * make `c1 + 1` stable.
 *
 * Returns `undefined` when the slice is too short or lacks the pattern.
 */
export function findStableStart(nodes: SubtreeNode[]): number | undefined {
	if (nodes.length < MIN_GROUP_SIZE + 1) {
		return undefined;
	}

	let prevPrevCut: number | undefined;
	let prevCut: number | undefined;

	for (let pos = 0; pos < nodes.length; pos++) {
		if (!isNaturalCut(nodes[pos].hash)) {
			continue;
		}

		if (
			prevCut !== undefined &&
			validGap(pos - prevCut) &&
			prevPrevCut !== undefined &&
			validGap(prevCut - prevPrevCut)
		) {
			return prevCut + 1;
		}

		prevPrevCut = prevCut;
		prevCut = pos;
	}

	return undefined;
}

/**
 * Find the last stable group boundary scanning right-to-left; the mirror of
 * {@link findStableStart}. Everything from the returned index onward is the
 * unstable suffix that cannot yet be merged.
 */
export function findStableEnd(nodes: SubtreeNode[]): number | undefined {
	if (nodes.length < MIN_GROUP_SIZE + 1) {
		return undefined;
	}

	let nextNextCut: number | undefined;
	let nextCut: number | undefined;

	for (let pos = nodes.length - 1; pos >= 0; pos--) {
		if (!isNaturalCut(nodes[pos].hash)) {
			continue;
		}

		if (
			nextCut !== undefined &&
			validGap(nextCut - pos) &&
			nextNextCut !== undefined &&
			validGap(nextNextCut - nextCut)
		) {
			return nextCut + 1;
		}

		nextNextCut = nextCut;
		nextCut = pos;
	}

	return undefined;
}

/**
 * The core per-level operation, mirroring Rust's `split_and_promote`:
 * partitions `nodes` into `[prefixLen, suffixLen]`, appending merged group
 * nodes of the stable middle region to `promoted`.
 */
function splitAndPromote(
	nodes: SubtreeNode[],
	atStart: boolean,
	atEnd: boolean,
	promoted: SubtreeNode[],
): [number, number] {
	if (nodes.length <= 1) {
		return [nodes.length, 0];
	}

	let stableStart: number;
	if (atStart) {
		stableStart = 0;
	} else {
		const idx = findStableStart(nodes);
		if (idx === undefined) {
			return [nodes.length, 0];
		}
		stableStart = idx;
	}

	let stableEnd: number;
	if (atEnd) {
		stableEnd = nodes.length;
	} else {
		const idx = findStableEnd(nodes.slice(stableStart));
		if (idx === undefined) {
			return [nodes.length, 0];
		}
		stableEnd = stableStart + idx;
	}

	if (stableStart >= stableEnd) {
		return [nodes.length, 0];
	}

	let pos = stableStart;
	while (pos < stableEnd) {
		const cutLen = nextMergeCut(nodes, pos, stableEnd);
		promoted.push(mergedHashOfSequence(nodes.slice(pos, pos + cutLen)));
		pos += cutLen;
	}

	return [stableStart, nodes.length - stableEnd];
}

interface Hump {
	leftLevels: SubtreeNode[][];
	rightLevels: SubtreeNode[][];
}

/**
 * Flatten per-level left/right arrays into the storage layout used by Rust:
 * all left-side nodes ascending by level, then all right-side nodes
 * descending by level.
 */
function flattenHump(hump: Hump): { nodes: SubtreeNode[]; levels: Array<[number, number]> } {
	const nodes: SubtreeNode[] = [];
	for (const left of hump.leftLevels) {
		nodes.push(...left);
	}
	for (let level = hump.rightLevels.length - 1; level >= 0; level--) {
		nodes.push(...hump.rightLevels[level]);
	}
	const levels = hump.leftLevels.map((left, i) => [left.length, hump.rightLevels[i].length] satisfies [number, number]);
	return { nodes, levels };
}

/** Mirror of Rust's `build_hump`. */
function buildHump(chunks: SubtreeNode[], atStart: boolean, atEnd: boolean): Hump {
	const leftLevels: SubtreeNode[][] = [];
	const rightLevels: SubtreeNode[][] = [];

	let current = chunks;
	let allLeftsEmpty = true;
	let allRightsEmpty = true;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const levelAtStart = atStart && allLeftsEmpty;
		const levelAtEnd = atEnd && allRightsEmpty;

		const promoted: SubtreeNode[] = [];
		const [prefixLen, suffixLen] = splitAndPromote(current, levelAtStart, levelAtEnd, promoted);

		leftLevels.push(current.slice(0, prefixLen));
		rightLevels.push(current.slice(current.length - suffixLen));

		if (prefixLen > 0) {
			allLeftsEmpty = false;
		}
		if (suffixLen > 0) {
			allRightsEmpty = false;
		}

		if (promoted.length === 0) {
			break;
		}
		if (promoted.length === 1) {
			leftLevels.push(promoted);
			rightLevels.push([]);
			break;
		}

		current = promoted;
	}

	return { leftLevels, rightLevels };
}

export class MerkleHashSubtree {
	private nodes: SubtreeNode[];
	/** Per-level `[leftCount, rightCount]` pairs indexing into `nodes`. */
	private levels: Array<[number, number]>;
	private leftOffsets: number[];
	private rightOffsets: number[];
	/** True if this range begins at chunk 0 of the full sequence. */
	public atStart: boolean;
	/** True if this range ends at the last chunk of the full sequence. */
	public atEnd: boolean;

	private constructor(nodes: SubtreeNode[], levels: Array<[number, number]>, atStart: boolean, atEnd: boolean) {
		this.nodes = nodes;
		this.levels = levels;
		this.atStart = atStart;
		this.atEnd = atEnd;
		[this.leftOffsets, this.rightOffsets] = computeOffsets(levels);
	}

	/**
	 * Create a subtree from a contiguous run of level-0 chunks.
	 *
	 * - `atStart`: `chunks[0]` is the first chunk of the entire file.
	 * - `atEnd`: the last element of `chunks` is the file's final chunk.
	 */
	static fromChunks(atStart: boolean, chunks: SubtreeNode[], atEnd: boolean): MerkleHashSubtree {
		const { nodes, levels } = flattenHump(buildHump(chunks, atStart, atEnd));
		return new MerkleHashSubtree(nodes, levels, atStart, atEnd);
	}

	get numNodes(): number {
		return this.nodes.length;
	}

	get numLevels(): number {
		return this.levels.length;
	}

	get isEmpty(): boolean {
		return this.nodes.length === 0;
	}

	private leftAt(level: number): SubtreeNode[] {
		if (level >= this.levels.length) {
			return [];
		}
		const start = this.leftOffsets[level];
		return this.nodes.slice(start, start + this.levels[level][0]);
	}

	private rightAt(level: number): SubtreeNode[] {
		if (level >= this.levels.length) {
			return [];
		}
		const start = this.rightOffsets[level];
		return this.nodes.slice(start, start + this.levels[level][1]);
	}

	/**
	 * Merge an adjacent subtree (the right neighbor) into this one, in place.
	 * After the call, `this` covers the combined range: it keeps its own
	 * `atStart` and takes `other`'s `atEnd`.
	 *
	 * Throws if `this.atEnd` (nothing can follow the end) or `other.atStart`
	 * (the start cannot appear on the right side of a merge).
	 */
	mergeInto(other: MerkleHashSubtree): void {
		if (this.atEnd) {
			throw new Error("Cannot merge into a subtree that is already at the end");
		}
		if (other.atStart) {
			throw new Error("Cannot merge a subtree that is at the start on the right side");
		}

		const combinedAtStart = this.atStart;
		const combinedAtEnd = other.atEnd;

		const maxLevels = Math.max(this.numLevels, other.numLevels);

		const leftLevels: SubtreeNode[][] = [];
		const rightLevels: SubtreeNode[][] = [];
		let carry: SubtreeNode[] = [];
		let allLeftsEmpty = true;
		let allRightsEmpty = true;

		for (let level = 0; level < maxLevels; level++) {
			const full = [
				...this.leftAt(level),
				...this.rightAt(level),
				...carry,
				...other.leftAt(level),
				...other.rightAt(level),
			];

			const levelAtStart = combinedAtStart && allLeftsEmpty;
			const levelAtEnd = combinedAtEnd && allRightsEmpty;

			const promoted: SubtreeNode[] = [];
			const [prefixLen, suffixLen] = splitAndPromote(full, levelAtStart, levelAtEnd, promoted);

			leftLevels.push(full.slice(0, prefixLen));
			rightLevels.push(full.slice(full.length - suffixLen));

			if (prefixLen > 0) {
				allLeftsEmpty = false;
			}
			if (suffixLen > 0) {
				allRightsEmpty = false;
			}

			carry = promoted;
		}

		while (carry.length > 0) {
			if (carry.length === 1) {
				leftLevels.push(carry);
				rightLevels.push([]);
				carry = [];
			} else {
				const promoted: SubtreeNode[] = [];
				const [prefixLen, suffixLen] = splitAndPromote(
					carry,
					combinedAtStart && allLeftsEmpty,
					combinedAtEnd && allRightsEmpty,
					promoted,
				);

				leftLevels.push(carry.slice(0, prefixLen));
				rightLevels.push(carry.slice(carry.length - suffixLen));

				if (prefixLen > 0) {
					allLeftsEmpty = false;
				}
				if (suffixLen > 0) {
					allRightsEmpty = false;
				}

				carry = promoted;
			}
		}

		// Trim empty trailing levels
		while (
			leftLevels.length > 1 &&
			leftLevels[leftLevels.length - 1].length === 0 &&
			rightLevels[rightLevels.length - 1].length === 0
		) {
			leftLevels.pop();
			rightLevels.pop();
		}

		const { nodes, levels } = flattenHump({ leftLevels, rightLevels });
		this.nodes = nodes;
		this.levels = levels;
		[this.leftOffsets, this.rightOffsets] = computeOffsets(levels);
		this.atStart = combinedAtStart;
		this.atEnd = combinedAtEnd;
	}

	/**
	 * Merge multiple adjacent ranges left-to-right.
	 * Returns an empty fully-closed range when `ranges` is empty.
	 */
	static merge(ranges: MerkleHashSubtree[]): MerkleHashSubtree {
		if (ranges.length === 0) {
			return MerkleHashSubtree.fromChunks(true, [], true);
		}
		const result = ranges[0].clone();
		for (let i = 1; i < ranges.length; i++) {
			result.mergeInto(ranges[i]);
		}
		return result;
	}

	clone(): MerkleHashSubtree {
		return new MerkleHashSubtree(
			[...this.nodes],
			this.levels.map((l) => [...l] satisfies [number, number]),
			this.atStart,
			this.atEnd,
		);
	}

	/**
	 * The final aggregated hash — only available when both boundaries are
	 * known (`atStart && atEnd`). Equals `xorbHash(allChunks)`; apply
	 * `hmac(hash, zeroKey)` to obtain the file hash.
	 *
	 * Returns `undefined` when either boundary is unknown.
	 */
	finalHash(): Uint8Array | undefined {
		if (!this.atStart || !this.atEnd) {
			return undefined;
		}

		if (this.nodes.length === 0) {
			return new Uint8Array(32);
		}

		const top = this.levels.length - 1;
		const topLeft = this.leftAt(top);
		if (topLeft.length !== 1 || this.rightAt(top).length !== 0) {
			throw new Error("Invariant violation: fully-closed hump should have a single node at the top level");
		}
		return topLeft[0].hash;
	}

	/** Total byte length covered by this subtree. */
	get totalLength(): number {
		let total = 0;
		for (let level = 0; level < this.levels.length; level++) {
			for (const node of this.leftAt(level)) {
				total += node.length;
			}
			for (const node of this.rightAt(level)) {
				total += node.length;
			}
		}
		return total;
	}

	/** Serde-human-readable-compatible JSON (what the CAS server produces/accepts). */
	toJSON(): MerkleHashSubtreeJson {
		return {
			nodes: this.nodes.map((node) => ({ hash: hashToHex(node.hash), size: node.length })),
			levels: this.levels.map((l) => [...l] satisfies [number, number]),
			at_start: this.atStart,
			at_end: this.atEnd,
		};
	}

	static fromJSON(json: MerkleHashSubtreeJson): MerkleHashSubtree {
		return new MerkleHashSubtree(
			json.nodes.map((node) => ({ hash: hexToBytes(node.hash), length: node.size })),
			json.levels.map((l) => [l[0], l[1]] satisfies [number, number]),
			json.at_start,
			json.at_end,
		);
	}
}

/** Pre-compute left and right offset arrays from levels (mirror of Rust's `compute_offsets`). */
function computeOffsets(levels: Array<[number, number]>): [number[], number[]] {
	const leftOffsets: number[] = [];
	const rightOffsets: number[] = [];

	let cumulativeLeft = 0;
	for (const [leftCount] of levels) {
		leftOffsets.push(cumulativeLeft);
		cumulativeLeft += leftCount;
	}

	const totalLeft = cumulativeLeft;
	let cumulativeRightAfter = 0;
	for (const [, rightCount] of levels) {
		cumulativeRightAfter += rightCount;
	}
	for (const [, rightCount] of levels) {
		cumulativeRightAfter -= rightCount;
		rightOffsets.push(totalLeft + cumulativeRightAfter);
	}

	return [leftOffsets, rightOffsets];
}
