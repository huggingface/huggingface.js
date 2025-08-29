/**
 * Todo: add dedup: we actually need to remember chunks already written, and not add them to the xorb, and also
 *  take that into account for file reconstruction
 * Todo: byte grouping?
 */

import { bg4_split_bytes, XET_CHUNK_HEADER_BYTES, XetChunkCompressionScheme } from "./XetBlob";
import { compress as lz4_compress } from "../vendor/lz4js";
import { ChunkCache } from "./ChunkCache";
import { xetWriteToken, type XetWriteTokenParams } from "./xetWriteToken";
import type { ShardData } from "./shardParser";
import { parseShardData } from "./shardParser";

const TARGET_CHUNK_SIZE = 64 * 1024;
/* eslint-disable @typescript-eslint/no-unused-vars */
const MAX_CHUNK_SIZE = 2 * TARGET_CHUNK_SIZE;
const XORB_SIZE = 64 * 1024 * 1024;
const MAX_XORB_CHUNKS = 8 * 1024;
const INTERVAL_BETWEEN_REMOTE_DEDUP = 4_000_000; // 4MB

interface XorbEvent {
	event: "xorb";
	xorb: Uint8Array;
	hash: string;
	id: number;
	chunks: Array<{ hash: string; length: number }>;
	files: Array<{
		path: string;
		progress: number;
	}>;
}

class CurrentXorbInfo {
	id: number;
	offset: number;
	chunks: Array<{ hash: string; length: number; offset: number }>;

	/**
	 * path => 0..1 mapping of the current xorb
	 *
	 * eg
	 *
	 * A => 1
	 * B => 1
	 * C => 0.345
	 *
	 * If the xorb contains the end of file A, B, and up to 34.5% of file C
	 */
	fileProgress: Record<string, number>;
	data: Uint8Array;
	immutableData: {
		chunkIndex: number;
		offset: number;
	} | null;

	constructor() {
		this.id = 0;
		this.offset = 0;
		this.chunks = [];
		this.fileProgress = {};
		this.data = new Uint8Array(XORB_SIZE);
		this.immutableData = null;
	}

	event(computeXorbHash: (chunks: { hash: string; length: number }[]) => string): XorbEvent {
		const xorbChunksCleaned = this.chunks.map((chunk) => ({
			hash: chunk.hash,
			length: chunk.length,
		}));

		return {
			event: "xorb" as const,
			xorb: this.data.subarray(0, this.offset),
			hash: computeXorbHash(xorbChunksCleaned),
			chunks: xorbChunksCleaned,
			id: this.id,
			files: Object.entries(this.fileProgress).map(([path, progress]) => ({ path, progress })),
		};
	}
}

export async function* createXorbs(
	fileSources: AsyncGenerator<{ content: Blob; path: string; sha256: string }>,
	params: XetWriteTokenParams
): AsyncGenerator<
	| XorbEvent
	| {
			event: "file";
			path: string;
			hash: string;
			sha256: string;
			/** Percentage of file bytes that were deduplicated (0-1) */
			dedupRatio: number;
			representation: Array<{
				xorbId: number | string; // either xorb id (for local xorbs) or xorb hash (for remote xorbs)
				indexStart: number;
				indexEnd: number;
				/** Unpacked length */
				length: number;
				rangeHash: string;
			}>;
	  },
	void,
	undefined
> {
	const chunkModule = await import("../vendor/xet-chunk/chunker_wasm");
	let xorbId = 0;

	await chunkModule.init();
	const chunker = new chunkModule.Chunker(TARGET_CHUNK_SIZE);
	const chunkCache = new ChunkCache();
	let xorb = new CurrentXorbInfo();

	const nextXorb = (): XorbEvent => {
		const event = xorb.event(chunkModule.compute_xorb_hash.bind(chunkModule));

		xorbId++;
		xorb = new CurrentXorbInfo();
		xorb.id = xorbId;

		return event;
	};

	const pendingFileEvents: Array<{
		event: "file";
		path: string;
		hash: string;
		dedupRatio: number;
		sha256: string;
		representation: Array<{
			xorbId: number | string;
			indexStart: number;
			indexEnd: number;
			length: number;
			rangeHash: string;
		}>;
	}> = [];

	const remoteXorbHashes: string[] = [""]; // starts at index 1 (to simplify implem a bit)

	try {
		for await (const fileSource of fileSources) {
			let bytesSinceRemoteDedup = Infinity;
			const sourceChunks: Array<Uint8Array> = [];

			const reader = fileSource.content.stream().getReader();
			let processedBytes = 0;
			let dedupedBytes = 0; // Track bytes that were deduplicated
			// Needed to compute the final file hash
			// todo: have the wasm function to compute file hash be able to take data chunk by chunk instead of all at once
			const fileChunks: Array<{ hash: string; length: number }> = [];
			// Collect chunk metadata to build representation at the end
			// todo: build partial representation at the end of each xorb, to avoid having to store all chunks in memory
			const chunkMetadata: Array<{
				xorbId: number | string;
				chunkIndex: number;
				length: number;
			}> = [];

			const addChunks = async function* (chunks: Array<{ hash: string; length: number; dedup: boolean }>) {
				for (const chunk of chunks) {
					let chunkIndex = xorb.chunks.length;
					let chunkXorbId = xorbId;
					fileChunks.push({ hash: chunk.hash, length: chunk.length });

					// Remove chunks from source data
					let chunkToCopy: Uint8Array;
					if (chunk.length === sourceChunks[0].length) {
						chunkToCopy = sourceChunks[0];
						sourceChunks.shift();
					} else if (chunk.length < sourceChunks[0].length) {
						chunkToCopy = sourceChunks[0].subarray(0, chunk.length);
						sourceChunks[0] = sourceChunks[0].subarray(chunk.length);
					} else {
						chunkToCopy = new Uint8Array(chunk.length);
						let copyOffset = 0;
						let index = 0;
						let toSlice = -1;
						while (copyOffset < chunk.length) {
							const nToCopy = Math.min(sourceChunks[index].length, chunk.length - copyOffset);
							chunkToCopy.set(sourceChunks[index].subarray(0, nToCopy), copyOffset);
							copyOffset += nToCopy;

							if (nToCopy === sourceChunks[index].length) {
								index++;
							} else {
								toSlice = nToCopy;
							}
						}
						sourceChunks.splice(0, index);
						if (toSlice !== -1) {
							sourceChunks[0] = sourceChunks[0].subarray(toSlice);
						}
					}

					let cacheData = chunkCache.getChunk(chunk.hash, chunkModule.compute_hmac);
					if (cacheData === undefined && chunk.dedup && bytesSinceRemoteDedup >= INTERVAL_BETWEEN_REMOTE_DEDUP) {
						const token = await xetWriteToken(params);
						bytesSinceRemoteDedup = 0;

						const shardResp = await params.customFetch(token.casUrl + "/v1/chunk/default/" + chunk.hash, {
							headers: {
								Authorization: `Bearer ${token.accessToken}`,
							},
						});

						// todo: handle non-404 non-429 errors, eg throw error
						if (shardResp.ok) {
							const shard = await shardResp.blob();
							const shardData = await parseShardData(shard);

							for (const xorb of shardData.xorbs) {
								const remoteXorbId = -remoteXorbHashes.length;
								remoteXorbHashes.push(xorb.hash);
								let i = 0;
								for (const chunk of xorb.chunks) {
									chunkCache.addChunkToCache(chunk.hash, remoteXorbId, i++, shardData.hmacKey);
								}
							}
							cacheData = chunkCache.getChunk(chunk.hash, chunkModule.compute_hmac);

							// We backtrack a bit to check if new dedup info contains older chunks
							dedupedBytes = backtrackDedup(
								xorb,
								chunkModule.compute_hmac.bind(chunkModule),
								shardData,
								chunkCache,
								chunkMetadata,
								dedupedBytes
							);
						}
					}
					if (cacheData === undefined) {
						if (!writeChunk(xorb, chunkToCopy, chunk.hash)) {
							// Failure to write chunk, maybe because it went over xorb size limit
							yield nextXorb();

							chunkIndex = 0;
							chunkXorbId = xorbId;

							for (const event of pendingFileEvents) {
								event.representation = event.representation.map((rep) => ({
									...rep,
									xorbId: (rep.xorbId as number) >= 0 ? rep.xorbId : remoteXorbHashes[-rep.xorbId],
								}));
								yield event;
							}
							pendingFileEvents.length = 0;

							if (!writeChunk(xorb, chunkToCopy, chunk.hash)) {
								throw new Error("Failed to write chunk into xorb");
							}
						}

						chunkCache.addChunkToCache(chunk.hash, xorbId, chunkIndex, null);
					} else {
						chunkXorbId = cacheData.xorbIndex;
						chunkIndex = cacheData.chunkIndex;
						dedupedBytes += chunk.length; // Track deduplicated bytes
					}
					bytesSinceRemoteDedup += chunk.length;

					// Collect metadata for building representation at the end
					chunkMetadata.push({
						xorbId: chunkXorbId,
						chunkIndex: chunkIndex,
						length: chunk.length,
					});
					xorb.fileProgress[fileSource.path] = processedBytes / fileSource.content.size;
					if (xorb.chunks.length >= MAX_XORB_CHUNKS) {
						yield nextXorb();

						for (const event of pendingFileEvents) {
							event.representation = event.representation.map((rep) => ({
								...rep,
								xorbId: (rep.xorbId as number) >= 0 ? rep.xorbId : remoteXorbHashes[-rep.xorbId],
							}));
							yield event;
						}
						pendingFileEvents.length = 0;
					}
				}
			};

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					yield* addChunks(chunker.finish());
					break;
				}
				processedBytes += value.length;
				sourceChunks.push(value);
				yield* addChunks(chunker.add_data(value));
			}

			const fileRepresentation = buildFileRepresentation(
				chunkMetadata,
				fileChunks,
				chunkModule.compute_verification_hash.bind(chunkModule)
			);
			xorb.immutableData = {
				chunkIndex: xorb.chunks.length,
				offset: xorb.offset,
			};
			const dedupRatio = fileSource.content.size > 0 ? dedupedBytes / fileSource.content.size : 0;

			pendingFileEvents.push({
				event: "file" as const,
				path: fileSource.path,
				hash: chunkModule.compute_file_hash(fileChunks),
				sha256: fileSource.sha256,
				dedupRatio,
				representation: fileRepresentation,
			});
		}

		if (xorb.offset > 0) {
			yield xorb.event(chunkModule.compute_xorb_hash.bind(chunkModule));
		}

		for (const event of pendingFileEvents) {
			event.representation = event.representation.map((rep) => ({
				...rep,
				xorbId: (rep.xorbId as number) >= 0 ? rep.xorbId : remoteXorbHashes[-rep.xorbId],
			}));
			yield event;
		}
	} finally {
		chunker.free();
		// ^ is this really needed ?
	}
}

function backtrackDedup(
	xorb: CurrentXorbInfo,
	computeHmac: (hash: string, key: string) => string,
	shardData: ShardData,
	chunkCache: ChunkCache,
	chunkMetadata: { xorbId: number | string; chunkIndex: number; length: number }[],
	dedupedBytes: number
) {
	const chunkIndexesToBacktrackFor = new Map<number, { xorbId: number; chunkIndex: number }>();
	for (
		let chunkToRecheckIndex = xorb.immutableData?.chunkIndex ?? 0;
		chunkToRecheckIndex < xorb.chunks.length;
		chunkToRecheckIndex++
	) {
		const chunk = xorb.chunks[chunkToRecheckIndex];
		const hmacHash = computeHmac(chunk.hash, shardData.hmacKey);
		const cacheData = chunkCache.getChunk(hmacHash, null);
		if (cacheData !== undefined) {
			chunkIndexesToBacktrackFor.set(chunkToRecheckIndex, {
				xorbId: cacheData.xorbIndex,
				chunkIndex: cacheData.chunkIndex,
			});
			chunkCache.removeChunkFromCache(chunk.hash);
		}
	}

	// Use remote dedup info to update chunk metadata for file representation
	for (const metadata of chunkMetadata) {
		if (metadata.xorbId === xorb.id && chunkIndexesToBacktrackFor.has(metadata.chunkIndex)) {
			const backtrackData = chunkIndexesToBacktrackFor.get(metadata.chunkIndex);
			if (backtrackData !== undefined) {
				metadata.xorbId = backtrackData.xorbId;
				metadata.chunkIndex = backtrackData.chunkIndex;
				dedupedBytes += metadata.length;
			}
		}
	}

	// Remove chunks that were backtracked from xorbChunks
	const xorbRangesToErase: Array<{ start: number; end: number }> = [];
	for (let i = 0; i < xorb.chunks.length; i++) {
		const chunk = xorb.chunks[i];
		if (chunkIndexesToBacktrackFor.has(i)) {
			xorbRangesToErase.push({
				start: chunk.offset,
				end: i < xorb.chunks.length - 1 ? xorb.chunks[i + 1].offset : xorb.offset,
			});
		}
	}
	const xorbRangesToKeep: Array<{ start: number; end: number }> = [];
	let currentStart = 0;
	for (let i = 0; i < xorbRangesToErase.length; i++) {
		const range = xorbRangesToErase[i];
		if (currentStart !== range.start) {
			xorbRangesToKeep.push({ start: currentStart, end: range.start });
		}
		currentStart = range.end;
	}
	if (currentStart !== xorb.offset) {
		xorbRangesToKeep.push({ start: currentStart, end: xorb.offset });
	}

	let currentOffset = 0;
	for (const range of xorbRangesToKeep) {
		if (range.start !== currentOffset) {
			xorb.data.set(xorb.data.subarray(range.start, range.end), currentOffset);
		}
		currentOffset += range.end - range.start;
	}
	const newXorbChunks: Array<{ hash: string; length: number; offset: number }> = [];
	const oldIndexToNewIndex = new Map<number, number>();
	let erasedOffset = 0;
	for (let i = 0; i < xorb.chunks.length; i++) {
		const chunk = xorb.chunks[i];
		if (chunkIndexesToBacktrackFor.has(i)) {
			if (i < xorb.chunks.length - 1) {
				erasedOffset += xorb.chunks[i + 1].offset - chunk.offset;
			}
		} else {
			newXorbChunks.push({
				hash: chunk.hash,
				length: chunk.length,
				offset: chunk.offset - erasedOffset,
			});
			// Only need a mapping if index changed (at least one previous chunk was erased)
			if (erasedOffset > 0) {
				oldIndexToNewIndex.set(i, newXorbChunks.length - 1);
			}
		}
	}
	xorb.chunks = newXorbChunks;
	xorb.offset = currentOffset;
	for (const chunk of chunkMetadata) {
		if (chunk.xorbId === xorb.id) {
			const newIndex = oldIndexToNewIndex.get(chunk.chunkIndex);
			if (newIndex !== undefined) {
				chunk.chunkIndex = newIndex;
			}
		}
	}
	return dedupedBytes;
}

// interface ChunkHeader {
// 	version: number; // u8, 1 byte
// 	compressed_length: number; // 3 * u8, 3 bytes
// 	compression_scheme: CompressionScheme; // u8, 1 byte
// 	uncompressed_length: number; // 3 * u8, 3 bytes
// }

// const CHUNK_HEADER_BYTES = 8;

/**
 * Write a chunk header to the xorb and return the offset of where to write the next chunk
 *
 * If it returns 0, it means there wasn't enough space in the xorb
 */
function writeChunk(xorb: CurrentXorbInfo, chunk: Uint8Array, hash: string): boolean {
	const regularCompressedChunk = lz4_compress(chunk);
	const bgCompressedChunk = lz4_compress(bg4_split_bytes(chunk));
	const compressedChunk =
		bgCompressedChunk.length < regularCompressedChunk.length ? bgCompressedChunk : regularCompressedChunk;
	const chunkToWrite = compressedChunk.length < chunk.length ? compressedChunk : chunk;

	if (xorb.offset + XET_CHUNK_HEADER_BYTES + chunkToWrite.length > XORB_SIZE) {
		return false;
	}

	xorb.data[xorb.offset] = 0;
	xorb.data[xorb.offset + 1] = chunkToWrite.length & 0xff;
	xorb.data[xorb.offset + 2] = (chunkToWrite.length >> 8) & 0xff;
	xorb.data[xorb.offset + 3] = (chunkToWrite.length >> 16) & 0xff;
	xorb.data[xorb.offset + 4] =
		chunkToWrite.length < chunk.length
			? bgCompressedChunk.length < regularCompressedChunk.length
				? XetChunkCompressionScheme.ByteGroupingLZ4
				: XetChunkCompressionScheme.LZ4
			: XetChunkCompressionScheme.None;
	xorb.data[xorb.offset + 5] = chunk.length & 0xff;
	xorb.data[xorb.offset + 6] = (chunk.length >> 8) & 0xff;
	xorb.data[xorb.offset + 7] = (chunk.length >> 16) & 0xff;

	xorb.data.set(chunkToWrite, xorb.offset + XET_CHUNK_HEADER_BYTES);

	xorb.chunks.push({ hash, length: chunk.length, offset: xorb.offset });
	xorb.offset += XET_CHUNK_HEADER_BYTES + chunkToWrite.length;
	return true;
}

// Build file representation from collected metadata
const buildFileRepresentation = (
	metadata: Array<{ xorbId: number | string; chunkIndex: number; length: number }>,
	chunks: Array<{ hash: string; length: number }>,
	computeVerificationHash: (hashes: string[]) => string
): Array<{
	xorbId: number | string;
	indexStart: number;
	indexEnd: number;
	length: number;
	rangeHash: string;
}> => {
	if (metadata.length === 0) {
		return [];
	}

	const representation: Array<{
		xorbId: number | string;
		indexStart: number;
		indexEnd: number;
		length: number;
		rangeHash: string;
	}> = [];

	let currentRange = {
		xorbId: metadata[0].xorbId,
		indexStart: metadata[0].chunkIndex,
		indexEnd: metadata[0].chunkIndex + 1,
		length: metadata[0].length,
		chunkHashStart: 0,
	};

	for (let i = 1; i < metadata.length; i++) {
		const chunk = metadata[i];

		// Check if this chunk continues the current range
		if (currentRange.xorbId === chunk.xorbId && currentRange.indexEnd === chunk.chunkIndex) {
			// Extend current range
			currentRange.indexEnd = chunk.chunkIndex + 1;
			currentRange.length += chunk.length;
		} else {
			// Finalize current range and start a new one
			const rangeHash = computeVerificationHash(chunks.slice(currentRange.chunkHashStart, i).map((x) => x.hash));
			representation.push({
				xorbId: currentRange.xorbId,
				indexStart: currentRange.indexStart,
				indexEnd: currentRange.indexEnd,
				length: currentRange.length,
				rangeHash,
			});

			currentRange = {
				xorbId: chunk.xorbId,
				indexStart: chunk.chunkIndex,
				indexEnd: chunk.chunkIndex + 1,
				length: chunk.length,
				chunkHashStart: i,
			};
		}
	}

	// Finalize the last range
	const rangeHash = computeVerificationHash(chunks.slice(currentRange.chunkHashStart).map((x) => x.hash));
	representation.push({
		xorbId: currentRange.xorbId,
		indexStart: currentRange.indexStart,
		indexEnd: currentRange.indexEnd,
		length: currentRange.length,
		rangeHash,
	});

	return representation;
};
