import { nextMatch } from "@huggingface/gearhash-wasm/assembly";
import { blake3Keyed } from "@huggingface/blake3-wasm/assembly";

// Constants
const TARGET_CHUNK_SIZE: i32 = 64 * 1024; // 64KB
const MINIMUM_CHUNK_DIVISOR: i32 = 8;
const MAXIMUM_CHUNK_MULTIPLIER: i32 = 2;
const HASH_WINDOW_SIZE: i32 = 64;

const BLAKE3_DATA_KEY = new Uint8Array(32);
const STATIC_KEY: StaticArray<u8> = [
	102, 151, 245, 119, 91, 149, 80, 222, 49, 53, 203, 172, 165, 151, 24, 28, 157, 228, 33, 16, 155, 235, 43, 88, 180,
	208, 176, 75, 147, 173, 242, 41,
];
for (let i = 0; i < 32; i++) {
	BLAKE3_DATA_KEY[i] = STATIC_KEY[i];
}

export class Chunk {
	hash: Uint8Array;
	length: i32;
}

// Type for the next() method return value
class NextResult {
	chunk: Chunk | null;
	bytesConsumed: i32;
}

class XetChunker {
	private minimumChunk: i32;
	private maximumChunk: i32;
	private mask: u64;
	private chunkBuf: Uint8Array;
	private curChunkLen: i32;
	private hash: u64;

	constructor(targetChunkSize: i32 = TARGET_CHUNK_SIZE) {
		// Validate target chunk size is a power of 2
		assert(targetChunkSize > 0, "Target chunk size must be greater than 0");
		assert((targetChunkSize & (targetChunkSize - 1)) == 0, "Target chunk size must be a power of 2");
		assert(targetChunkSize > HASH_WINDOW_SIZE, "Target chunk size must be greater than hash window size");
		assert(targetChunkSize < i32.MAX_VALUE, "Target chunk size must be less than i32.MAX_VALUE");

		let mask = (targetChunkSize - 1) as u64;
		// Shift mask left by leading zeros count
		mask = mask << clz(mask);

		const maximumChunk = targetChunkSize * MAXIMUM_CHUNK_MULTIPLIER;

		this.minimumChunk = targetChunkSize / MINIMUM_CHUNK_DIVISOR;
		this.maximumChunk = maximumChunk;
		this.mask = mask;
		this.chunkBuf = new Uint8Array(maximumChunk);
		this.curChunkLen = 0;
		this.hash = 0;
	}

	next(data: Uint8Array, isFinal: boolean): NextResult {
		const nBytes = data.length;
		let createChunk = false;
		let consumeLen: i32 = 0;

		if (nBytes != 0) {
			// Skip minimum chunk size
			if (this.curChunkLen + HASH_WINDOW_SIZE < this.minimumChunk) {
				const maxAdvance = min(this.minimumChunk - this.curChunkLen - HASH_WINDOW_SIZE - 1, nBytes - consumeLen);
				consumeLen += maxAdvance;
				this.curChunkLen += maxAdvance;
			}

			// Calculate read end
			const readEnd = min(nBytes, consumeLen + this.maximumChunk - this.curChunkLen);

			let bytesToNextBoundary: i32;
			const matchResult = nextMatch(data.subarray(consumeLen, readEnd), this.mask, this.hash);

			if (matchResult.position != -1) {
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
			const chunk: Chunk = {
				length: chunkData.length,
				hash: blake3Keyed(chunkData, BLAKE3_DATA_KEY),
			};
			this.curChunkLen = 0;
			this.hash = 0;
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
		let pos: i32 = 0;

		while (pos < data.length) {
			const result = this.next(data.subarray(pos), isFinal);
			if (result.chunk) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				chunks.push(result.chunk!);
			}
			pos += result.bytesConsumed;
		}

		return chunks;
	}

	finish(): Chunk | null {
		return this.next(new Uint8Array(0), true).chunk;
	}
}

export function createChunker(targetChunkSize: i32 = TARGET_CHUNK_SIZE): XetChunker {
	const chunker = new XetChunker(targetChunkSize);

	return chunker;
}

export function nextBlock(chunker: XetChunker, data: Uint8Array): Chunk[] {
	return chunker.nextBlock(data, false);
}

export function finalize(chunker: XetChunker): Chunk | null {
	return chunker.finish();
}

export function getChunks(data: Uint8Array, targetChunkSize: i32 = TARGET_CHUNK_SIZE): Chunk[] {
	// console.log(`getChunks: ${targetChunkSize} ${data.length}`);
	const chunker = createChunker(targetChunkSize);
	return chunker.nextBlock(data, true);
}

export function hashToHex(hash: Uint8Array): string {
	const view = new DataView(hash.buffer);
	const u64 = view.getUint64(0, true);
	const u64_2 = view.getUint64(8, true);
	const u64_3 = view.getUint64(16, true);
	const u64_4 = view.getUint64(24, true);

	const hex =
		u64.toString(16).padStart(16, "0") +
		u64_2.toString(16).padStart(16, "0") +
		u64_3.toString(16).padStart(16, "0") +
		u64_4.toString(16).padStart(16, "0");
	return hex;
}
