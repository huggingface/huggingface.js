import { Hasher } from "gearhash-jit";
import { createKeyed, Hasher as Blake3Hasher } from "@huggingface/blake3-jit";

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

interface NextResult {
	chunk: Chunk | null;
	bytesConsumed: number;
}

class XetChunker {
	private minimumChunk: number;
	private maximumChunk: number;
	private chunkBuf: Uint8Array;
	private curChunkLen: number;
	private gear: Hasher;
	private blake3: Blake3Hasher;

	constructor(targetChunkSize: number = TARGET_CHUNK_SIZE) {
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
		let leadingZeros = 0;
		for (let i = 63; i >= 0; i--) {
			if ((mask & (1n << BigInt(i))) !== 0n) {
				break;
			}
			leadingZeros++;
		}
		mask = mask << BigInt(leadingZeros);

		const maximumChunk = targetChunkSize * MAXIMUM_CHUNK_MULTIPLIER;

		this.minimumChunk = targetChunkSize / MINIMUM_CHUNK_DIVISOR;
		this.maximumChunk = maximumChunk;
		this.chunkBuf = new Uint8Array(maximumChunk);
		this.curChunkLen = 0;
		this.gear = new Hasher(mask);
		this.blake3 = Blake3Hasher.newKeyed(BLAKE3_DATA_KEY);
	}

	/**
	 * Streaming entry point: accepts an arbitrary slice of data, accumulates
	 * it, and emits a chunk when a boundary (or max size) is reached.
	 * Data is copied into an internal buffer because it may span calls.
	 */
	next(data: Uint8Array, isFinal: boolean): NextResult {
		const nBytes = data.length;
		let createChunk = false;
		let consumeLen = 0;

		if (nBytes !== 0) {
			if (this.curChunkLen + HASH_WINDOW_SIZE < this.minimumChunk) {
				const maxAdvance = Math.min(this.minimumChunk - this.curChunkLen - HASH_WINDOW_SIZE - 1, nBytes - consumeLen);
				consumeLen += maxAdvance;
				this.curChunkLen += maxAdvance;
			}

			const readEnd = Math.min(nBytes, consumeLen + this.maximumChunk - this.curChunkLen);

			let bytesToNextBoundary: number;
			const position = this.gear.nextMatch(data.subarray(consumeLen, readEnd));

			if (position !== -1) {
				bytesToNextBoundary = position;
				createChunk = true;
			} else {
				bytesToNextBoundary = readEnd - consumeLen;
			}

			if (bytesToNextBoundary + this.curChunkLen >= this.maximumChunk) {
				bytesToNextBoundary = this.maximumChunk - this.curChunkLen;
				createChunk = true;
			}

			this.curChunkLen += bytesToNextBoundary;
			consumeLen += bytesToNextBoundary;

			this.chunkBuf.set(data.subarray(0, consumeLen), this.curChunkLen - consumeLen);
		}

		if (createChunk || (isFinal && this.curChunkLen > 0)) {
			const chunkData = this.chunkBuf.subarray(0, this.curChunkLen);
			const hash = this.blake3.reset().update(chunkData).finalize(32);
			const chunk: Chunk = {
				length: chunkData.length,
				hash: hash,
			};
			this.curChunkLen = 0;
			this.gear.resetHash();
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

	/**
	 * Batch entry point: processes a large contiguous buffer and returns all
	 * complete chunks. Hashes directly from `data` — no intermediate copy
	 * to chunkBuf — for every chunk whose bytes are fully within `data`.
	 */
	nextBlock(data: Uint8Array, isFinal: boolean): Chunk[] {
		const chunks: Chunk[] = [];
		let pos = 0;

		// Drain any leftover from a previous nextBlock / next call.
		while (pos < data.length && this.curChunkLen > 0) {
			const result = this.next(data.subarray(pos), false);
			if (result.chunk) chunks.push(result.chunk);
			pos += result.bytesConsumed;
		}

		const minSkip = this.minimumChunk > HASH_WINDOW_SIZE
			? this.minimumChunk - HASH_WINDOW_SIZE - 1
			: 0;

		while (pos < data.length) {
			const chunkStart = pos;
			const scanStart = Math.min(pos + minSkip, data.length);
			const scanEnd = Math.min(data.length, pos + this.maximumChunk);

			const position = this.gear.nextMatch(data.subarray(scanStart, scanEnd));

			let chunkEnd: number;
			let foundBoundary: boolean;

			if (position !== -1 && scanStart + position - chunkStart <= this.maximumChunk) {
				chunkEnd = scanStart + position;
				foundBoundary = true;
			} else if (scanEnd - chunkStart >= this.maximumChunk) {
				chunkEnd = chunkStart + this.maximumChunk;
				foundBoundary = true;
			} else {
				foundBoundary = false;
				chunkEnd = scanEnd;
			}

			if (foundBoundary) {
				const hash = this.blake3.reset()
					.update(data.subarray(chunkStart, chunkEnd))
					.finalize(32);
				chunks.push({ length: chunkEnd - chunkStart, hash });
				pos = chunkEnd;
				this.gear.resetHash();
			} else if (isFinal) {
				const hash = this.blake3.reset()
					.update(data.subarray(chunkStart))
					.finalize(32);
				chunks.push({ length: data.length - chunkStart, hash });
				pos = data.length;
			} else {
				this.chunkBuf.set(data.subarray(chunkStart), 0);
				this.curChunkLen = data.length - chunkStart;
				pos = data.length;
			}
		}

		return chunks;
	}

	finish(): Chunk | null {
		if (this.curChunkLen > 0) {
			const chunkData = this.chunkBuf.subarray(0, this.curChunkLen);
			const hash = this.blake3.reset().update(chunkData).finalize(32);
			const chunk: Chunk = { length: this.curChunkLen, hash };
			this.curChunkLen = 0;
			this.gear.resetHash();
			return chunk;
		}
		return null;
	}
}

export function createChunker(targetChunkSize: number = TARGET_CHUNK_SIZE): XetChunker {
	return new XetChunker(targetChunkSize);
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

	return (
		u64.toString(16).padStart(16, "0") +
		u64_2.toString(16).padStart(16, "0") +
		u64_3.toString(16).padStart(16, "0") +
		u64_4.toString(16).padStart(16, "0")
	);
}

export function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(32);
	const view = new DataView(bytes.buffer);
	view.setBigUint64(0, BigInt("0x" + hex.slice(0, 16)), true);
	view.setBigUint64(8, BigInt("0x" + hex.slice(16, 32)), true);
	view.setBigUint64(16, BigInt("0x" + hex.slice(32, 48)), true);
	view.setBigUint64(24, BigInt("0x" + hex.slice(48, 64)), true);
	return bytes;
}
