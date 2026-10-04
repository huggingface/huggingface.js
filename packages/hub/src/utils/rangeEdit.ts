import { MerkleHashSubtree, hashToHex, hexToBytes, hmac } from "@huggingface/xetchunk-wasm";
import type { MerkleHashSubtreeJson } from "@huggingface/xetchunk-wasm";
import type { ReconstructionInfo, XetBlob } from "./XetBlob";
import type { SplicedBlob } from "./SplicedBlob";
import { xetWriteToken, type XetWriteTokenParams } from "./xetWriteToken";

/**
 * In-memory state of a file previously written through the range-edit path, keyed by its
 * xet hash. Lets a subsequent append (or edit of the file's last term) skip the
 * reconstruction and file-chunk-hashes API calls entirely: the partial merkle state and
 * verification hashes are already known.
 *
 * Pass the same {@link RangeEditCache} instance to successive `commit` calls that append to
 * the same file to avoid calling the CAS metadata APIs on every append.
 */
export type RangeEditCache = Map<string, RangeEditCacheEntry>;

export interface RangeEditCacheEntry {
	/** Total file size in bytes */
	size: number;
	/** The file's terms, in order, with their verification range hashes */
	terms: Array<OriginalTerm & { rangeHash: string }>;
	/**
	 * Partial merkle state of all chunks except the last term's
	 * (`at_start: true, at_end: false`); `null` when the file has a single term.
	 */
	openSubtree: MerkleHashSubtreeJson | null;
	/** The last term's chunks (hash + length) */
	lastTermChunks: Array<{ hash: string; length: number }>;
}

const RANGE_EDIT_CACHE_MAX_ENTRIES = 10;

export function addToRangeEditCache(cache: RangeEditCache, xetHash: string, entry: RangeEditCacheEntry): void {
	cache.delete(xetHash);
	cache.set(xetHash, entry);
	while (cache.size > RANGE_EDIT_CACHE_MAX_ENTRIES) {
		const oldest = cache.keys().next().value;
		if (oldest === undefined) {
			break;
		}
		cache.delete(oldest);
	}
}

/**
 * Support for editing xet files without downloading the parts of the file that
 * are not modified, using the CAS APIs:
 *
 * - `GET /v2/reconstructions/{file_id}`: the original file's term/segment layout.
 * - `GET /v2/file-chunk-hashes/{file_id}` with the `X-Range-Dirty` header: chunk-aligned
 *   windows to re-chunk, {@link MerkleHashSubtree} summaries of the untouched gaps and
 *   verification hashes for the untouched terms.
 *
 * This mirrors xet-core's `upload_ranges` (`xet_data/src/processing/range_upload.rs`).
 */

/** One chunk-aligned dirty window of a file, returned by `GET /v2/file-chunk-hashes/{file_id}`. */
export interface ChunkWindow {
	/** `[start, end)` in original-file byte offsets, expanded outward to stable chunk boundaries */
	dirtyByteRange: [number, number];
}

/** Response shape of `GET /v2/file-chunk-hashes/{file_id}` */
export interface FileChunkHashesResponse {
	totalChunks: number;
	fileSize: number;
	windows: ChunkWindow[];
	/**
	 * `windows.length + 1` entries: partial merkle summaries of the clean gaps before,
	 * between and after the windows. `null` when the gap is empty.
	 */
	hashRanges: Array<MerkleHashSubtreeJson | null>;
	/**
	 * One verification range hash per **stable original term** (a term that lies entirely
	 * outside every window, in term order). These become the `rangeHash` of reused terms.
	 */
	gapVerification: string[];
}

export interface OriginalTerm {
	/** Xorb hash (hex) */
	hash: string;
	/** Unpacked byte length of the term */
	unpackedLength: number;
	/** Chunk index range within the xorb, end-exclusive */
	range: { start: number; end: number };
}

/** A splice operation in original-file coordinates, assigned to a window */
export interface RangeEditOperation {
	insert: Blob;
	start: number;
	end: number;
}

export interface RangeEditWindow {
	/** Window start, in original-file byte offsets. Always a term boundary. */
	start: number;
	/**
	 * Window end as returned by the server, in original-file byte offsets. Always a chunk
	 * boundary (the server extends the requested range until the chunker provably re-syncs),
	 * but **not necessarily a term boundary**.
	 */
	end: number;
	/**
	 * Window end extended to the next term boundary (or file end), in original-file byte
	 * offsets. The server's stable-boundary extension can make `end` land in the middle of
	 * a term; that term can then neither be reused (no verification hash is provided for a
	 * partially-covered term) nor partially referenced. So the client re-chunks up to the
	 * next term boundary: since the chunker has provably re-synced by `end` and resets its
	 * state at every chunk boundary, the chunks produced for `[end, effectiveEnd)` are
	 * bit-identical to the original file's chunks there — keeping the composed hash
	 * consistent with the server's gap subtrees, which cover `[end, …)`.
	 */
	effectiveEnd: number;
	/** The splice operations that land inside this window, sorted by start */
	edits: RangeEditOperation[];
	/** Size of the window data `[start, effectiveEnd)` after edits are applied */
	newSize: number;
	/**
	 * Size of the window data `[start, end)` after edits are applied. When computing the
	 * composed file hash, the window's chunk list must be split at this length: chunks
	 * before it pair with the server's gap subtrees (which start at `end`), chunks after it
	 * are original-file chunks only used for the shard representation.
	 */
	hashSplitSize: number;
}

export interface RangeEditPlan {
	/** Xet hash of the original file */
	originalHash: string;
	originalSize: number;
	/** New total file size */
	newSize: number;
	/** The original file's terms (segments), in order */
	terms: OriginalTerm[];
	/** `terms.length + 1` entries; `segByteStarts[i]` is the first byte of term `i` */
	segByteStarts: number[];
	windows: RangeEditWindow[];
	hashRanges: Array<MerkleHashSubtreeJson | null>;
	gapVerification: string[];
}

/**
 * Plan a range edit for a {@link SplicedBlob} whose original content is a {@link XetBlob}.
 *
 * Returns `undefined` when the server cannot provide the needed metadata (eg the original
 * file is not registered in the repo the write token is scoped to) — callers should then
 * fall back to processing the blob in full.
 */
export async function planRangeEdit(
	spliced: SplicedBlob,
	original: XetBlob,
	params: XetWriteTokenParams & { rangeEditCache?: RangeEditCache },
): Promise<RangeEditPlan | undefined> {
	const originalHash = original.hash;
	const originalSize = original.size;
	if (!originalHash || originalSize === 0 || original.start !== 0) {
		return undefined;
	}

	// Appends (and edits confined to the file's last term) can be planned entirely from
	// the in-memory state of a previous range-edit upload — no API call needed.
	if (params.rangeEditCache) {
		const cached = planRangeEditFromCache(spliced, originalHash, originalSize, params.rangeEditCache);
		if (cached) {
			return cached;
		}
	}

	const token = await xetWriteToken(params);

	// 1. Fetch the original file's term layout
	const reconstructionResp = await (params.fetch ?? fetch)(`${token.casUrl}/v2/reconstructions/${originalHash}`, {
		headers: { Authorization: `Bearer ${token.accessToken}` },
	});
	if (!reconstructionResp.ok) {
		return undefined;
	}
	const reconstruction = (await reconstructionResp.json()) as ReconstructionInfo;
	const terms: OriginalTerm[] = reconstruction.terms.map((term) => ({
		hash: term.hash,
		unpackedLength: term.unpacked_length,
		range: { start: term.range.start, end: term.range.end },
	}));

	const segByteStarts: number[] = [0];
	let acc = 0;
	for (const term of terms) {
		acc += term.unpackedLength;
		segByteStarts.push(acc);
	}
	if (acc !== originalSize) {
		throw new Error(
			`Original file size mismatch: reconstruction reports ${acc} bytes but the blob is ${originalSize} bytes`,
		);
	}

	// 2. Snap the dirty ranges to term boundaries and coalesce them
	const edits = spliced.spliceOperations;
	const dirtyRanges = snapAndCoalesceDirtyRanges(edits, segByteStarts, originalSize);
	if (dirtyRanges.length === 0) {
		return undefined;
	}

	// 3. Ask the server for windows + gap hash data
	const rangeHeader = "bytes=" + dirtyRanges.map(([start, end]) => `${start}-${end - 1}`).join(",");
	const resp = await (params.fetch ?? fetch)(`${token.casUrl}/v2/file-chunk-hashes/${originalHash}`, {
		headers: {
			Authorization: `Bearer ${token.accessToken}`,
			"X-Range-Dirty": rangeHeader,
		},
	});
	if (!resp.ok) {
		return undefined;
	}
	const chunkHashes = (await resp.json()) as FileChunkHashesResponse;

	if (chunkHashes.windows.length === 0) {
		throw new Error("Server returned no windows for range edit");
	}
	if (chunkHashes.hashRanges.length !== chunkHashes.windows.length + 1) {
		throw new Error(
			`Server returned ${chunkHashes.hashRanges.length} hashRanges, expected ${chunkHashes.windows.length + 1}`,
		);
	}

	// 4. Assign the edits to the windows
	const windows = assignEditsToWindows(
		chunkHashes.windows.map((w) => ({ start: w.dirtyByteRange[0], end: w.dirtyByteRange[1] })),
		edits,
		originalSize,
		segByteStarts,
	);

	return {
		originalHash,
		originalSize,
		newSize: spliced.size,
		terms,
		segByteStarts,
		windows,
		hashRanges: chunkHashes.hashRanges,
		gapVerification: chunkHashes.gapVerification,
	};
}

/**
 * Plan an edit purely from cached file state, without any API call. Only possible when
 * every edit lands within the file's last term (the common case being an append), since the
 * cache keeps the partial merkle state of everything before it plus the last term's chunks.
 */
export function planRangeEditFromCache(
	spliced: SplicedBlob,
	originalHash: string,
	originalSize: number,
	cache: RangeEditCache,
): RangeEditPlan | undefined {
	const entry = cache.get(originalHash);
	if (!entry || entry.size !== originalSize || entry.terms.length === 0) {
		return undefined;
	}

	const edits = spliced.spliceOperations;
	if (edits.length === 0) {
		return undefined;
	}

	const lastTerm = entry.terms[entry.terms.length - 1];
	const lastTermStart = originalSize - lastTerm.unpackedLength;

	// All edits must be confined to the last term (appends have start === end === size)
	for (const edit of edits) {
		const editStart = edit.start === edit.end && edit.start === originalSize ? originalSize : edit.start;
		if (editStart < lastTermStart) {
			return undefined;
		}
	}

	const segByteStarts: number[] = [0];
	let acc = 0;
	for (const term of entry.terms) {
		acc += term.unpackedLength;
		segByteStarts.push(acc);
	}

	const windows = assignEditsToWindows(
		[{ start: lastTermStart, end: originalSize }],
		edits,
		originalSize,
		segByteStarts,
	);

	return {
		originalHash,
		originalSize,
		newSize: spliced.size,
		terms: entry.terms,
		segByteStarts,
		windows,
		hashRanges: [entry.openSubtree, null],
		gapVerification: entry.terms.slice(0, -1).map((term) => term.rangeHash),
	};
}

/**
 * Snap each edit's dirty range to the enclosing term boundaries, then sort and coalesce.
 *
 * Snapping to *term* boundaries (rather than chunk boundaries) lets us swap whole terms
 * during composition. Term edges are chunk edges, so the server's chunk-aligned windows
 * come back identical to the snapped ranges.
 */
export function snapAndCoalesceDirtyRanges(
	edits: Array<{ start: number; end: number }>,
	segByteStarts: number[],
	originalSize: number,
): Array<[number, number]> {
	const nSegs = segByteStarts.length - 1;

	/** Largest term-start byte that is `<= byte` */
	const snapStart = (byte: number): number => {
		let idx = 0;
		while (idx + 1 < segByteStarts.length && segByteStarts[idx + 1] <= byte) {
			idx++;
		}
		return segByteStarts[idx];
	};
	/** Smallest term-start byte that is `>= byte` */
	const snapEnd = (byte: number): number => {
		let idx = 0;
		while (idx < segByteStarts.length && segByteStarts[idx] < byte) {
			idx++;
		}
		return segByteStarts[Math.min(idx, segByteStarts.length - 1)];
	};

	const snapped: Array<[number, number]> = [];
	for (const edit of edits) {
		if (edit.start === edit.end) {
			// Pure insert: pick the term containing the insert position. At end-of-file,
			// fall back to the last term.
			if (edit.start === originalSize) {
				snapped.push([segByteStarts[nSegs - 1], segByteStarts[nSegs]]);
			} else {
				snapped.push([snapStart(edit.start), snapEnd(edit.start + 1)]);
			}
		} else {
			snapped.push([snapStart(edit.start), snapEnd(edit.end)]);
		}
	}

	snapped.sort((a, b) => a[0] - b[0]);
	const coalesced: Array<[number, number]> = [];
	for (const range of snapped) {
		const last = coalesced[coalesced.length - 1];
		if (last && range[0] <= last[1]) {
			last[1] = Math.max(last[1], range[1]);
			continue;
		}
		coalesced.push([range[0], range[1]]);
	}
	return coalesced;
}

/**
 * Assign each edit to exactly one window, and compute each window's effective end (the
 * server's window end extended to the next term boundary, see
 * {@link RangeEditWindow.effectiveEnd}).
 *
 * A pure insert at exactly `window.end` belongs to that window only when
 * `window.end === originalSize` (no later window can take it); anywhere else it belongs to
 * the next window starting at that byte.
 *
 * Throws when an edit cannot be assigned (the server returned narrower windows than
 * requested), since silently dropping it would produce a corrupt file.
 */
export function assignEditsToWindows(
	windows: Array<{ start: number; end: number }>,
	edits: RangeEditOperation[],
	originalSize: number,
	segByteStarts: number[],
): RangeEditWindow[] {
	let editIdx = 0;
	const result: RangeEditWindow[] = [];

	for (const [windowIdx, window] of windows.entries()) {
		const assigned: RangeEditOperation[] = [];
		while (editIdx < edits.length) {
			const edit = edits[editIdx];
			const belongsHere =
				edit.start === edit.end
					? edit.start < window.end || (edit.start === window.end && window.end === originalSize)
					: edit.end <= window.end;
			if (!belongsHere) {
				break;
			}
			if (edit.start < window.start) {
				throw new Error(
					`Edit at [${edit.start}, ${edit.end}) starts before its window [${window.start}, ${window.end})`,
				);
			}
			assigned.push(edit);
			editIdx++;
		}

		let removed = 0;
		let added = 0;
		for (const edit of assigned) {
			removed += edit.end - edit.start;
			added += edit.insert.size;
		}

		// Extend the window to the next term boundary >= window.end. The last entry of
		// segByteStarts is the file size and windows are clamped to it, so this always exists.
		const effectiveEnd = segByteStarts.find((segStart) => segStart >= window.end);
		if (effectiveEnd === undefined) {
			throw new Error(`Window end ${window.end} exceeds the file size ${segByteStarts[segByteStarts.length - 1]}`);
		}
		const nextWindowStart = windows[windowIdx + 1]?.start;
		if (nextWindowStart !== undefined && effectiveEnd > nextWindowStart) {
			throw new Error(
				`Window [${window.start}, ${window.end}) extends to term boundary ${effectiveEnd}, overlapping the next window at ${nextWindowStart}`,
			);
		}

		result.push({
			start: window.start,
			end: window.end,
			effectiveEnd,
			edits: assigned,
			newSize: effectiveEnd - window.start + added - removed,
			hashSplitSize: window.end - window.start + added - removed,
		});
	}

	if (editIdx !== edits.length) {
		throw new Error(`${edits.length - editIdx} edits were not assigned to any window`);
	}

	return result;
}

/**
 * The sequence of blobs whose concatenation is the new content of a window
 * (`[start, effectiveEnd)` with the edits applied): original slices between edits, and the
 * edits' insert blobs.
 */
export function windowSegments(window: RangeEditWindow, original: Blob): Blob[] {
	const segments: Blob[] = [];
	let cursor = window.start;
	for (const edit of window.edits) {
		if (cursor < edit.start) {
			segments.push(original.slice(cursor, edit.start));
		}
		if (edit.insert.size > 0) {
			segments.push(edit.insert);
		}
		cursor = edit.end;
	}
	if (cursor < window.effectiveEnd) {
		segments.push(original.slice(cursor, window.effectiveEnd));
	}
	return segments;
}

export interface RepresentationEntry {
	xorbId: number | string;
	indexStart: number;
	indexEnd: number;
	length: number;
	rangeHash: string;
}

/**
 * Splice the windows' representations into the original term list: original terms outside
 * every window are reused as-is (their `rangeHash` comes from `gapVerification`), terms
 * covered by a window are replaced by the window's freshly-built representation.
 */
export function composeRepresentation(
	plan: RangeEditPlan,
	windowRepresentations: RepresentationEntry[][],
): RepresentationEntry[] {
	const representation: RepresentationEntry[] = [];
	const nSegs = plan.terms.length;
	let segIdx = 0;
	let gapIdx = 0;

	const reuseTerm = (idx: number): void => {
		const rangeHash = plan.gapVerification[gapIdx];
		if (rangeHash === undefined) {
			throw new Error(`Ran out of gapVerification entries at stable term ${idx}`);
		}
		gapIdx++;
		representation.push({
			xorbId: plan.terms[idx].hash,
			indexStart: plan.terms[idx].range.start,
			indexEnd: plan.terms[idx].range.end,
			length: plan.terms[idx].unpackedLength,
			rangeHash,
		});
	};

	for (let i = 0; i < plan.windows.length; i++) {
		const window = plan.windows[i];
		while (segIdx < nSegs && plan.segByteStarts[segIdx] < window.start) {
			if (plan.segByteStarts[segIdx + 1] > window.start) {
				throw new Error(
					`Window starting at ${window.start} straddles term ${segIdx} (${plan.segByteStarts[segIdx]}..${plan.segByteStarts[segIdx + 1]})`,
				);
			}
			reuseTerm(segIdx);
			segIdx++;
		}
		// Terms covered by [window.start, window.effectiveEnd) are replaced by the window's
		// representation. effectiveEnd is a term boundary, so no term is partially covered.
		while (segIdx < nSegs && plan.segByteStarts[segIdx] < window.effectiveEnd) {
			segIdx++;
		}
		representation.push(...windowRepresentations[i]);
	}
	while (segIdx < nSegs) {
		reuseTerm(segIdx);
		segIdx++;
	}
	if (gapIdx < plan.gapVerification.length) {
		throw new Error(
			`Server returned ${plan.gapVerification.length} gapVerification entries but only ${gapIdx} stable terms were emitted`,
		);
	}

	return representation;
}

const ZERO_KEY = new Uint8Array(32);

/**
 * Index into `chunks` such that the chunks before it sum to exactly `size` bytes.
 * Throws when `size` does not land on a chunk boundary.
 */
function chunkSplitIndex(chunks: Array<{ hash: string; length: number }>, size: number, context: string): number {
	let cumulative = 0;
	let index = 0;
	while (index < chunks.length && cumulative < size) {
		cumulative += chunks[index].length;
		index++;
	}
	if (cumulative !== size) {
		throw new Error(`${context}: expected a chunk boundary at ${size} bytes, got ${cumulative}`);
	}
	return index;
}

/**
 * Data attached to a file event so {@link addToRangeEditCache} can be fed once local xorb
 * ids are resolved to hashes (in `uploadShards`).
 */
export interface RangeEditCachePayload {
	size: number;
	openSubtree: MerkleHashSubtreeJson | null;
	lastTermChunks: Array<{ hash: string; length: number }>;
}

/**
 * Build the cache payload after a range-edit upload: the last term's chunks plus an open
 * subtree over everything before them. Returns `undefined` when the file's last term is a
 * reused original term (its chunks are unknown).
 */
export function buildRangeEditCachePayload(
	plan: RangeEditPlan,
	windowChunks: Array<Array<{ hash: string; length: number }>>,
	representation: RepresentationEntry[],
): RangeEditCachePayload | undefined {
	// The trailing gap must be empty, ie the last window ends the file — otherwise the last
	// term is a reused original term whose chunks we don't know.
	if (plan.hashRanges[plan.hashRanges.length - 1] !== null) {
		return undefined;
	}
	const lastRep = representation[representation.length - 1];
	const lastWindow = windowChunks[windowChunks.length - 1];
	if (!lastRep || !lastWindow) {
		return undefined;
	}
	const lastTermChunkCount = lastRep.indexEnd - lastRep.indexStart;
	if (lastTermChunkCount <= 0 || lastTermChunkCount > lastWindow.length) {
		return undefined;
	}
	const lastTermChunks = lastWindow.slice(lastWindow.length - lastTermChunkCount);

	const hashRanges = plan.hashRanges.map((json) => (json === null ? null : MerkleHashSubtree.fromJSON(json)));
	const firstWindowAtStart = hashRanges[0] === null;
	const sequence: MerkleHashSubtree[] = [];
	for (let i = 0; i < plan.windows.length; i++) {
		const gap = hashRanges[i];
		if (gap !== null && gap !== undefined) {
			sequence.push(gap);
		}
		const splitIndex = chunkSplitIndex(windowChunks[i], plan.windows[i].hashSplitSize, "buildRangeEditCachePayload");
		let chunks = windowChunks[i].slice(0, splitIndex);
		if (i === plan.windows.length - 1) {
			// Exclude the last term's chunks from the open subtree
			chunks = chunks.slice(0, chunks.length - lastTermChunkCount);
		}
		if (chunks.length > 0 || (i === 0 && firstWindowAtStart)) {
			sequence.push(
				MerkleHashSubtree.fromChunks(
					i === 0 && firstWindowAtStart,
					chunks.map((chunk) => ({ hash: hexToBytes(chunk.hash), length: chunk.length })),
					false,
				),
			);
		}
	}

	const openSubtree = sequence.length > 0 ? MerkleHashSubtree.merge(sequence) : null;
	return {
		size: plan.newSize,
		openSubtree: openSubtree && !openSubtree.isEmpty ? openSubtree.toJSON() : null,
		lastTermChunks,
	};
}

/**
 * Build the cache payload after a full (non-edit) upload of a file, so that subsequent
 * appends can skip the CAS metadata calls too.
 */
export function buildFreshFileCachePayload(
	fileChunks: Array<{ hash: string; length: number }>,
	representation: RepresentationEntry[],
): RangeEditCachePayload | undefined {
	const lastRep = representation[representation.length - 1];
	if (!lastRep) {
		return undefined;
	}
	const lastTermChunkCount = lastRep.indexEnd - lastRep.indexStart;
	if (lastTermChunkCount <= 0 || lastTermChunkCount > fileChunks.length) {
		return undefined;
	}
	const lastTermChunks = fileChunks.slice(fileChunks.length - lastTermChunkCount);
	const rest = fileChunks.slice(0, fileChunks.length - lastTermChunkCount);
	const openSubtree =
		rest.length > 0
			? MerkleHashSubtree.fromChunks(
					true,
					rest.map((chunk) => ({ hash: hexToBytes(chunk.hash), length: chunk.length })),
					false,
				).toJSON()
			: null;
	return {
		size: fileChunks.reduce((sum, chunk) => sum + chunk.length, 0),
		openSubtree,
		lastTermChunks,
	};
}

/**
 * Compute the new file hash by merging the gap subtrees with subtrees built from the
 * windows' freshly-computed chunks: `[gap0, window0, gap1, window1, ..., gapN]`.
 */
export function computeComposedFileHash(
	plan: RangeEditPlan,
	windowChunks: Array<Array<{ hash: string; length: number }>>,
): string {
	// Empty content is the one exception: `file_hash([])` short-circuits to the zero hash
	// without HMAC.
	if (plan.newSize === 0) {
		return "0".repeat(64);
	}

	const hashRanges = plan.hashRanges.map((json) => (json === null ? null : MerkleHashSubtree.fromJSON(json)));
	const trailingGap = hashRanges[hashRanges.length - 1];
	const firstWindowAtStart = hashRanges[0] === null;
	const lastWindowAtEnd = trailingGap === null;
	const lastIdx = plan.windows.length - 1;

	const mergeSequence: MerkleHashSubtree[] = [];
	for (let i = 0; i < plan.windows.length; i++) {
		const gap = hashRanges[i];
		if (gap !== null) {
			mergeSequence.push(gap);
		}
		// The server's gap subtrees cover the original chunks from `window.end` onwards, so
		// only the window chunks up to `hashSplitSize` participate in the merge; the chunks
		// past it re-produce original chunks already accounted for by the following gap.
		const window = plan.windows[i];
		const splitIndex = chunkSplitIndex(
			windowChunks[i],
			window.hashSplitSize,
			`Window [${window.start}, ${window.end}) chunk boundaries did not re-sync at the window end`,
		);
		mergeSequence.push(
			MerkleHashSubtree.fromChunks(
				i === 0 && firstWindowAtStart,
				windowChunks[i].slice(0, splitIndex).map((chunk) => ({ hash: hexToBytes(chunk.hash), length: chunk.length })),
				i === lastIdx && lastWindowAtEnd,
			),
		);
	}
	if (trailingGap !== null && trailingGap !== undefined) {
		mergeSequence.push(trailingGap);
	}

	const merged = MerkleHashSubtree.merge(mergeSequence);
	const aggregated = merged.finalHash();
	if (aggregated === undefined) {
		throw new Error("Merged subtree is not fully closed; cannot derive the file hash");
	}
	return hashToHex(hmac(aggregated, ZERO_KEY));
}
