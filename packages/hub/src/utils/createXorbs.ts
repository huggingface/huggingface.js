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

export async function* createXorbs(
	fileSources: AsyncGenerator<{ content: Blob; path: string; sha256: string }>,
	params: XetWriteTokenParams
): AsyncGenerator<
	| {
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
	let xorbChunks = Array<{ hash: string; length: number }>();
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
			const fileChunks: Array<{ hash: string; length: number }> = [];
			let currentChunkRangeBeginning = 0;
			const fileRepresentation: Array<{
				xorbId: number | string;
				indexStart: number;
				indexEnd: number;
				length: number;
				rangeHash: string;
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
						while (copyOffset < chunk.length) {
							chunkToCopy.set(sourceChunks[index].subarray(0, chunk.length - copyOffset), copyOffset);
							copyOffset += sourceChunks[index].length;
							index++;
						}
						sourceChunks.splice(0, index);
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
						}
					}
					if (cacheData === undefined) {
						xorbOffset = writeChunk(xorb, xorbOffset, chunkToCopy);

						if (xorbOffset === 0) {
							// Failure to write chunk, maybe because it went over xorb size limit
							yield {
								event: "xorb" as const,
								xorb: xorb.subarray(0, xorbOffset),
								hash: chunkModule.compute_xorb_hash(xorbChunks),
								chunks: [...xorbChunks],
								id: xorbId,
								files: Object.entries(xorbFileProgress).map(([path, progress]) => ({ path, progress })),
							};
							xorbId++;
							xorb = new Uint8Array(XORB_SIZE);
							chunkIndex = 0;
							chunkXorbId = xorbId;
							xorbFileProgress = {};

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
					} else {
						chunkXorbId = cacheData.xorbIndex;
						chunkIndex = cacheData.chunkIndex;
						dedupedBytes += chunk.length; // Track deduplicated bytes
					}
					bytesSinceRemoteDedup += chunk.length;

					const lastRep = fileRepresentation.at(-1);

					if (!lastRep) {
						fileRepresentation.push({
							xorbId: chunkXorbId,
							indexStart: chunkIndex,
							indexEnd: chunkIndex + 1,
							length: chunk.length,
							rangeHash: "",
						});
						currentChunkRangeBeginning = fileChunks.length - 1;
					} else {
						if (lastRep.xorbId === chunkXorbId && lastRep.indexEnd === chunkIndex) {
							lastRep.indexEnd = chunkIndex + 1;
							lastRep.length += chunk.length;
						} else {
							lastRep.rangeHash = chunkModule.compute_verification_hash(
								fileChunks.slice(currentChunkRangeBeginning, -1).map((x) => x.hash, -1)
							);
							fileRepresentation.push({
								xorbId: chunkXorbId,
								indexStart: chunkIndex,
								indexEnd: chunkIndex + 1,
								length: chunk.length,
								rangeHash: "",
							});
							currentChunkRangeBeginning = fileChunks.length - 1;
						}
					}
					xorbChunks.push({ hash: chunk.hash, length: chunk.length });
					xorbFileProgress[fileSource.path] = processedBytes / fileSource.content.size;
					if (xorbChunks.length >= MAX_XORB_CHUNKS) {
						yield {
							event: "xorb" as const,
							xorb: xorb.subarray(0, xorbOffset),
							hash: chunkModule.compute_xorb_hash(xorbChunks),
							chunks: [...xorbChunks],
							id: xorbId,
							files: Object.entries(xorbFileProgress).map(([path, progress]) => ({ path, progress })),
						};
						xorbId++;
						xorbOffset = 0;
						xorbChunks = [];
						xorbFileProgress = {};
						xorb = new Uint8Array(XORB_SIZE);

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

			const lastRep = fileRepresentation.at(-1);
			if (lastRep) {
				lastRep.rangeHash = chunkModule.compute_verification_hash(
					fileChunks.slice(currentChunkRangeBeginning).map((x) => x.hash)
				);
			}

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
		regularCompressedChunk.length < bgCompressedChunk.length ? regularCompressedChunk : bgCompressedChunk;
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
			? bgCompressedChunk.length < chunk.length
				? XetChunkCompressionScheme.ByteGroupingLZ4
				: XetChunkCompressionScheme.LZ4
			: XetChunkCompressionScheme.None;
	xorb[offset + 5] = chunk.length & 0xff;
	xorb[offset + 6] = (chunk.length >> 8) & 0xff;
	xorb[offset + 7] = (chunk.length >> 16) & 0xff;

	xorb.set(chunkToWrite, offset + XET_CHUNK_HEADER_BYTES);
	return offset + XET_CHUNK_HEADER_BYTES + chunkToWrite.length;
}
