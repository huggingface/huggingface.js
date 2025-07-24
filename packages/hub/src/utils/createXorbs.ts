/**
 * Todo: add dedup: we actually need to remember chunks already written, and not add them to the xorb, and also
 *  take that into account for file reconstruction
 * Todo: byte grouping?
 */

import { bg4_split_bytes, XET_CHUNK_HEADER_BYTES, XetChunkCompressionScheme } from "./XetBlob";
import { compress as lz4_compress } from "../vendor/lz4js";

const TARGET_CHUNK_SIZE = 64 * 1024;
/* eslint-disable @typescript-eslint/no-unused-vars */
const MAX_CHUNK_SIZE = 2 * TARGET_CHUNK_SIZE;
const XORB_SIZE = 64 * 1024 * 1024;
const MAX_XORB_CHUNKS = 8 * 1024;

export async function* createXorbs(
	fileSources: AsyncGenerator<{ content: Blob; path: string; sha256: string }>
): AsyncGenerator<
	| {
			type: "xorb";
			xorb: Uint8Array;
			hash: string;
			id: number;
			chunks: Array<{ hash: string; length: number; offset: number }>;
			files: Array<{
				path: string;
				progress: number;
			}>;
	  }
	| {
			type: "file";
			path: string;
			hash: string;
			sha256: string;
			representation: Array<{
				xorbId: number;
				offset: number;
				endOffset: number;
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

	let xorb = new Uint8Array(XORB_SIZE);
	let xorbOffset = 0;
	let xorbChunks = Array<{ hash: string; length: number; offset: number }>();
	let xorbFiles: Record<string, number> = {};

	try {
		for await (const fileSource of fileSources) {
			const initialXorbOffset = xorbOffset;
			const sourceChunks: Array<Uint8Array> = [];

			const reader = fileSource.content.stream().getReader();
			let processedBytes = 0;
			const fileChunks: Array<{ hash: string; length: number }> = [];
			let currentChunkRangeBeginning = 0;
			const fileRepresentation: Array<{
				xorbId: number;
				offset: number;
				endOffset: number;
				length: number;
				rangeHash: string;
			}> = [];

			const addChunks = function* (chunks: Array<{ hash: string; length: number }>) {
				for (const chunk of chunks) {
					let chunkOffset = xorbOffset;
					fileChunks.push({ hash: chunk.hash, length: chunk.length });
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
					xorbOffset = writeChunk(xorb, xorbOffset, chunkToCopy);
					if (xorbOffset === 0) {
						// Failure to write chunk, maybe because it went over xorb size limit
						yield {
							type: "xorb" as const,
							xorb: xorb.subarray(0, xorbOffset),
							hash: chunkModule.compute_xorb_hash(xorbChunks),
							chunks: [...xorbChunks],
							id: xorbId,
							files: Object.entries(xorbFiles).map(([path, progress]) => ({ path, progress })),
						};
						xorbId++;
						xorb = new Uint8Array(XORB_SIZE);
						chunkOffset = 0;
						xorbOffset = writeChunk(xorb, 0, chunkToCopy);
						xorbFiles = {};

						if (xorbOffset === 0) {
							throw new Error("Failed to write chunk into xorb");
						}
					}
					const lastRep = fileRepresentation.at(-1);

					if (!lastRep) {
						fileRepresentation.push({
							xorbId,
							offset: initialXorbOffset,
							endOffset: xorbOffset - initialXorbOffset,
							length: chunk.length,
							rangeHash: "",
						});
						currentChunkRangeBeginning = fileChunks.length - 1;
					} else {
						if (lastRep.xorbId === xorbId) {
							lastRep.endOffset = xorbOffset - lastRep.offset;
							lastRep.length += chunk.length;
						} else {
							lastRep.rangeHash = chunkModule.compute_verification_hash(
								fileChunks.slice(currentChunkRangeBeginning, -1).map((x) => x.hash, -1)
							);
							fileRepresentation.push({
								xorbId,
								offset: 0,
								endOffset: xorbOffset,
								length: chunk.length,
								rangeHash: "",
							});
							currentChunkRangeBeginning = fileChunks.length - 1;
						}
					}
					xorbChunks.push({ hash: chunk.hash, length: chunk.length, offset: chunkOffset });
					xorbFiles[fileSource.path] = processedBytes / fileSource.content.size;
					if (xorbChunks.length >= MAX_XORB_CHUNKS) {
						yield {
							type: "xorb" as const,
							xorb: xorb.subarray(0, xorbOffset),
							hash: chunkModule.compute_xorb_hash(xorbChunks),
							chunks: [...xorbChunks],
							id: xorbId,
							files: Object.entries(xorbFiles).map(([path, progress]) => ({ path, progress })),
						};
						xorbId++;
						xorbOffset = 0;
						xorbChunks = [];
						xorbFiles = {};
						xorb = new Uint8Array(XORB_SIZE);
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

			yield {
				type: "file" as const,
				path: fileSource.path,
				hash: chunkModule.compute_file_hash(fileChunks),
				representation: fileRepresentation,
				sha256: fileSource.sha256,
			};
		}

		if (xorbOffset > 0) {
			yield {
				type: "xorb" as const,
				xorb: xorb.subarray(0, xorbOffset),
				hash: chunkModule.compute_xorb_hash(xorbChunks),
				chunks: [...xorbChunks],
				id: xorbId,
				files: Object.entries(xorbFiles).map(([path, progress]) => ({ path, progress })),
			};
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
