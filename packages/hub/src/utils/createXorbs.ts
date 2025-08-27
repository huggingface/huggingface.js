/**
 * Todo: add dedup: we actually need to remember chunks already written, and not add them to the xorb, and also
 *  take that into account for file reconstruction
 * Todo: byte grouping?
 */

import { bg4_split_bytes, XET_CHUNK_HEADER_BYTES, XetChunkCompressionScheme } from "./XetBlob";
import { compress as lz4_compress } from "../vendor/lz4js";
import { ChunkCache } from "./ChunkCache";
import { xetWriteToken, type XetWriteTokenParams } from "./xetWriteToken";
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
	let xorb = new Uint8Array(XORB_SIZE);
	let xorbOffset = 0;
	let xorbChunks = Array<{ hash: string; length: number; offset: number }>();
	let xorbImmutableData = null as null | {
		chunkIndex: number;
		offset: number;
	};

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
	let xorbFileProgress: Record<string, number> = {};

	const nextXorb = (): XorbEvent => {
		xorbId++;
		xorbOffset = 0;
		xorbChunks = [];
		xorbFileProgress = {};
		xorb = new Uint8Array(XORB_SIZE);
		xorbImmutableData = null;

		// Remove "offset" + clone
		const xorbChunksCleaned = xorbChunks.map((chunk) => ({
			hash: chunk.hash,
			length: chunk.length,
		}));

		return {
			event: "xorb" as const,
			xorb: xorb.subarray(0, xorbOffset),
			hash: chunkModule.compute_xorb_hash(xorbChunksCleaned),
			chunks: xorbChunksCleaned,
			id: xorbId,
			files: Object.entries(xorbFileProgress).map(([path, progress]) => ({ path, progress })),
		};
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
			// todo: build representation at the end of each xorb
			const chunkMetadata: Array<{
				xorbId: number | string;
				chunkIndex: number;
				length: number;
			}> = [];

			const addChunks = async function* (chunks: Array<{ hash: string; length: number; dedup: boolean }>) {
				for (const chunk of chunks) {
					let chunkIndex = xorbChunks.length;
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
							const chunkIndexesToBacktrackFor = new Map<number, { xorbId: number; chunkIndex: number }>();
							for (
								let chunkToRecheckIndex = xorbImmutableData?.chunkIndex ?? 0;
								chunkToRecheckIndex < xorbChunks.length;
								chunkToRecheckIndex++
							) {
								const chunk = xorbChunks[chunkToRecheckIndex];
								const hmacHash = chunkModule.compute_hmac(chunk.hash, shardData.hmacKey);
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
								if (metadata.xorbId === xorbId && chunkIndexesToBacktrackFor.has(metadata.chunkIndex)) {
									const backtrackData = chunkIndexesToBacktrackFor.get(metadata.chunkIndex);
									if (backtrackData !== undefined) {
										metadata.xorbId = backtrackData.xorbId;
										metadata.chunkIndex = backtrackData.chunkIndex;
									}
								}
							}

							// Remove chunks that were backtracked from xorbChunks
							// todo
						}
					}
					if (cacheData === undefined) {
						xorbOffset = writeChunk(xorb, xorbOffset, chunkToCopy);

						if (xorbOffset === 0) {
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

							xorbOffset = writeChunk(xorb, 0, chunkToCopy);

							if (xorbOffset === 0) {
								throw new Error("Failed to write chunk into xorb");
							}
						}

						chunkCache.addChunkToCache(chunk.hash, xorbId, chunkIndex, null);
						xorbChunks.push({ hash: chunk.hash, length: chunk.length, offset: xorbOffset });
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
					xorbFileProgress[fileSource.path] = processedBytes / fileSource.content.size;
					if (xorbChunks.length >= MAX_XORB_CHUNKS) {
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
			xorbImmutableData = {
				chunkIndex: xorbChunks.length,
				offset: xorbOffset,
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

		if (xorbOffset > 0) {
			yield {
				event: "xorb" as const,
				xorb: xorb.subarray(0, xorbOffset),
				hash: chunkModule.compute_xorb_hash(xorbChunks),
				chunks: [...xorbChunks],
				id: xorbId,
				files: Object.entries(xorbFileProgress).map(([path, progress]) => ({ path, progress })),
			};
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
 *
 * Todo: add bg4 compression maybe?
 */
function writeChunk(xorb: Uint8Array, offset: number, chunk: Uint8Array): number {
	const regularCompressedChunk = lz4_compress(chunk);
	const bgCompressedChunk = lz4_compress(bg4_split_bytes(chunk));
	const compressedChunk =
		bgCompressedChunk.length < regularCompressedChunk.length ? bgCompressedChunk : regularCompressedChunk;
	const chunkToWrite = compressedChunk.length < chunk.length ? compressedChunk : chunk;

	if (offset + XET_CHUNK_HEADER_BYTES + chunkToWrite.length > XORB_SIZE) {
		return 0;
	}

	xorb[offset] = 0;
	xorb[offset + 1] = chunkToWrite.length & 0xff;
	xorb[offset + 2] = (chunkToWrite.length >> 8) & 0xff;
	xorb[offset + 3] = (chunkToWrite.length >> 16) & 0xff;
	xorb[offset + 4] =
		chunkToWrite.length < chunk.length
			? bgCompressedChunk.length < regularCompressedChunk.length
				? XetChunkCompressionScheme.ByteGroupingLZ4
				: XetChunkCompressionScheme.LZ4
			: XetChunkCompressionScheme.None;
	xorb[offset + 5] = chunk.length & 0xff;
	xorb[offset + 6] = (chunk.length >> 8) & 0xff;
	xorb[offset + 7] = (chunk.length >> 16) & 0xff;

	xorb.set(chunkToWrite, offset + XET_CHUNK_HEADER_BYTES);
	return offset + XET_CHUNK_HEADER_BYTES + chunkToWrite.length;
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
