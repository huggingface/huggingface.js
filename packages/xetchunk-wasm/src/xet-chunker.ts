import { nextMatch } from "@huggingface/gearhash-wasm";
import { createKeyed } from "blake3-jit";

// Constants
const TARGET_CHUNK_SIZE = 64 * 1024; // 64KB
const MINIMUM_CHUNK_DIVISOR = 8;
const MAXIMUM_CHUNK_MULTIPLIER = 2;
const HASH_WINDOW_SIZE = 64;

const BLAKE3_DATA_KEY = new Uint8Array([
	102, 151, 245, 119, 91, 149, 80, 222, 49, 53, 203, 172, 165, 151, 24, 28, 157, 228, 33, 16, 155, 235, 43, 88, 180,
	208, 176, 75, 147, 173, 242, 41,
]);

export interface Chunk {
	hash: Uint8Array;
	length: number;
}

// Type for the next() method return value
interface NextResult {
	chunk: Chunk | null;
	bytesConsumed: number;
}

class XetChunker {
	private minimumChunk: number;
	private maximumChunk: number;
	private mask: bigint;
	private chunkBuf: Uint8Array;
	private curChunkLen: number;
	private hash: bigint;

	constructor(targetChunkSize: number = TARGET_CHUNK_SIZE) {
		// Validate target chunk size is a power of 2
		if (targetChunkSize <= 0) {
			throw new Error("Target chunk size must be greater than 0");
		}
		if ((targetChunkSize & (targetChunkSize - 1)) !== 0) {
			throw new Error("Target chunk size must be a power of 2");
		}
		if (targetChunkSize <= HASH_WINDOW_SIZE) {
			throw new Error("Target chunk size must be greater than hash window size");
		}
		if (targetChunkSize >= Number.MAX_SAFE_INTEGER) {
			throw new Error("Target chunk size must be less than Number.MAX_SAFE_INTEGER");
		}

		let mask = BigInt(targetChunkSize - 1);
		// Count leading zeros (clz for 64-bit BigInt)
		let leadingZeros = 0;
		for (let i = 63; i >= 0; i--) {
			if ((mask & (1n << BigInt(i))) !== 0n) {
				break;
			}
			leadingZeros++;
		}
		// Shift mask left by leading zeros count
		mask = mask << BigInt(leadingZeros);

		const maximumChunk = targetChunkSize * MAXIMUM_CHUNK_MULTIPLIER;

		this.minimumChunk = targetChunkSize / MINIMUM_CHUNK_DIVISOR;
		this.maximumChunk = maximumChunk;
		this.mask = mask;
		this.chunkBuf = new Uint8Array(maximumChunk);
		this.curChunkLen = 0;
		this.hash = 0n;
	}

	next(data: Uint8Array, isFinal: boolean): NextResult {
		const nBytes = data.length;
		let createChunk = false;
		let consumeLen = 0;

		if (nBytes !== 0) {
			// Skip minimum chunk size
			if (this.curChunkLen + HASH_WINDOW_SIZE < this.minimumChunk) {
				const maxAdvance = Math.min(this.minimumChunk - this.curChunkLen - HASH_WINDOW_SIZE - 1, nBytes - consumeLen);
				consumeLen += maxAdvance;
				this.curChunkLen += maxAdvance;
			}

			// Calculate read end
			const readEnd = Math.min(nBytes, consumeLen + this.maximumChunk - this.curChunkLen);

			let bytesToNextBoundary: number;
			const matchResult = nextMatch(data.subarray(consumeLen, readEnd), this.mask, this.hash);

			if (matchResult.position !== -1) {
				bytesToNextBoundary = matchResult.position;
				createChunk = true;
				this.hash = matchResult.hash;
			} else {
				bytesToNextBoundary = readEnd - consumeLen;
				this.hash = matchResult.hash;
			}

			// Check if we hit maximum chunk
			if (bytesToNextBoundary + this.curChunkLen >= this.maximumChunk) {
				bytesToNextBoundary = this.maximumChunk - this.curChunkLen;
				createChunk = true;
			}

			this.curChunkLen += bytesToNextBoundary;
			consumeLen += bytesToNextBoundary;

			// Copy data to chunk buffer
			this.chunkBuf.set(data.subarray(0, consumeLen), this.curChunkLen - consumeLen);
		}

		if (createChunk || (isFinal && this.curChunkLen > 0)) {
			const chunkData = this.chunkBuf.subarray(0, this.curChunkLen);
			const hash = createKeyed(BLAKE3_DATA_KEY).update(chunkData).finalize(32);
			const chunk: Chunk = {
				length: chunkData.length,
				hash: hash,
			};
			this.curChunkLen = 0;
			this.hash = 0n;
			return {
				chunk,
				bytesConsumed: consumeLen,
			};
		}

		return {
			chunk: null,
			bytesConsumed: consumeLen,
		};
	}

	nextBlock(data: Uint8Array, isFinal: boolean): Chunk[] {
		const chunks: Chunk[] = [];
		let pos = 0;

		while (pos < data.length) {
			const result = this.next(data.subarray(pos), isFinal);
			if (result.chunk) {
				chunks.push(result.chunk);
			}
			pos += result.bytesConsumed;
		}

		return chunks;
	}

	finish(): Chunk | null {
		return this.next(new Uint8Array(0), true).chunk;
	}
}

export function createChunker(targetChunkSize: number = TARGET_CHUNK_SIZE): XetChunker {
	const chunker = new XetChunker(targetChunkSize);
	return chunker;
}

export function nextBlock(chunker: XetChunker, data: Uint8Array): Chunk[] {
	return chunker.nextBlock(data, false);
}

export function finalize(chunker: XetChunker): Chunk | null {
	return chunker.finish();
}

export function getChunks(data: Uint8Array, targetChunkSize: number = TARGET_CHUNK_SIZE): Chunk[] {
	const chunker = createChunker(targetChunkSize);
	return chunker.nextBlock(data, true);
}

export function hashToHex(hash: Uint8Array): string {
	const view = new DataView(hash.buffer, hash.byteOffset, hash.byteLength);
	const u64 = view.getBigUint64(0, true);
	const u64_2 = view.getBigUint64(8, true);
	const u64_3 = view.getBigUint64(16, true);
	const u64_4 = view.getBigUint64(24, true);

	const hex =
		u64.toString(16).padStart(16, "0") +
		u64_2.toString(16).padStart(16, "0") +
		u64_3.toString(16).padStart(16, "0") +
		u64_4.toString(16).padStart(16, "0");
	return hex;
}
