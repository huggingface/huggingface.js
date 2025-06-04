import { nextMatch } from "@huggingface/gearhash-wasm/assembly";
import { Blake3Hasher } from "@huggingface/blake3-wasm/assembly";

// Constants
const TARGET_CHUNK_SIZE: usize = 64 * 1024; // 64KB
const MINIMUM_CHUNK_DIVISOR: usize = 8;
const MAXIMUM_CHUNK_MULTIPLIER: usize = 2;
const HASH_WINDOW_SIZE: usize = 64;

export class Chunk {
	hash: Uint8Array;
	data: Uint8Array;

	constructor(hash: Uint8Array, data: Uint8Array) {
		this.hash = hash;
		this.data = data;
	}
}

// Type for the next() method return value
export class NextResult {
	chunk: Chunk | null;
	bytesConsumed: usize;

	constructor(chunk: Chunk | null, bytesConsumed: usize) {
		this.chunk = chunk;
		this.bytesConsumed = bytesConsumed;
	}
}

export class XetChunker {
	private minimumChunk: usize;
	private maximumChunk: usize;
	private mask: u64;
	private chunkBuf: Uint8Array;
	private curChunkLen: usize;
	private hash: u64;

	constructor(targetChunkSize: usize = TARGET_CHUNK_SIZE) {
		// Validate target chunk size is a power of 2
		assert((targetChunkSize & (targetChunkSize - 1)) == 0, "Target chunk size must be a power of 2");
		assert(targetChunkSize > HASH_WINDOW_SIZE, "Target chunk size must be greater than hash window size");
		assert(targetChunkSize < u32.MAX_VALUE, "Target chunk size must be less than u32.MAX_VALUE");

		let mask = (targetChunkSize - 1) as u64;
		// Shift mask left by leading zeros count
		mask = mask << (64 - clz(mask));

		this.minimumChunk = targetChunkSize / MINIMUM_CHUNK_DIVISOR;
		this.maximumChunk = targetChunkSize * MAXIMUM_CHUNK_MULTIPLIER;
		this.mask = mask;
		this.chunkBuf = new Uint8Array(this.maximumChunk);
		this.curChunkLen = 0;
		this.hash = 0;
	}

	next(data: Uint8Array, isFinal: boolean): NextResult {
		const nBytes = data.length;
		let createChunk = false;
		let consumeLen: usize = 0;

		if (nBytes != 0) {
			// Skip minimum chunk size
			if (this.curChunkLen + HASH_WINDOW_SIZE < this.minimumChunk) {
				const maxAdvance = min(this.minimumChunk - this.curChunkLen - HASH_WINDOW_SIZE - 1, nBytes - consumeLen);
				consumeLen += maxAdvance;
				this.curChunkLen += maxAdvance;
			}

			// Calculate read end
			const readEnd = min(nBytes, consumeLen + this.maximumChunk - this.curChunkLen);

			let bytesToNextBoundary: usize;
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
			const chunk = new Chunk(computeDataHash(chunkData), chunkData);
			this.curChunkLen = 0;
			this.hash = 0;
			return new NextResult(chunk, consumeLen);
		}

		return new NextResult(null, consumeLen);
	}

	nextBlock(data: Uint8Array, isFinal: boolean): Chunk[] {
		const chunks: Chunk[] = [];
		let pos: usize = 0;

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

function computeDataHash(data: Uint8Array): Uint8Array {
	const hasher = new Blake3Hasher();
	hasher.update(data);
	const hash = new Uint8Array(32);
	hasher.finalize(hash);
	return hash;
}
