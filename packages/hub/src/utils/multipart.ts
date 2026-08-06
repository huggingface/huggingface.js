import { combineUint8Arrays } from "./combineUint8Arrays";
import { indexOfSubsequence } from "./indexOfSubsequence";

const textEncoder = new TextEncoder();
const CRLF = textEncoder.encode("\r\n");
const HEADER_SEPARATOR = textEncoder.encode("\r\n\r\n");

/**
 * Small appends (eg byte-by-byte or tiny network reads) are coalesced into blocks of this size,
 * so the in-progress part is a bounded list of large chunks instead of one object per push.
 */
const STAGING_BLOCK_SIZE = 65536;

/**
 * Incrementally parses a `multipart/byteranges` body, yielding each part's raw bytes as it
 * completes, without buffering the whole body.
 *
 * Feed network chunks to `push()` as they arrive; returned values are the raw bytes of each
 * completed part (in body order, which for Xet signed URLs is ascending byte order). A part is
 * only emitted once its terminating boundary has been seen, so memory stays bounded by the
 * largest part rather than the whole body.
 */
export class StreamingMultipartParser {
	#delimiter: Uint8Array;
	/**
	 * Unprocessed bytes carried between pushes: bounded by the delimiter length in states 0/2
	 * (a possible partial delimiter), tiny in state 1. Seeded with a virtual CRLF so a body
	 * starting directly with `--boundary` (RFC 2046: the first delimiter's leading CRLF is
	 * "considered part of the preamble") still matches the `\r\n--boundary` delimiter.
	 */
	#carry: Uint8Array = CRLF;
	/** Confirmed bytes (headers + data) of the in-progress part, as ≥STAGING_BLOCK_SIZE chunks. */
	#partChunks: Uint8Array[] = [];
	#partLength = 0;
	/** Staging block coalescing small appends; pushed to #partChunks when full. */
	#staging: Uint8Array | undefined;
	#stagingLength = 0;
	/** 0 = scanning for first boundary, 1 = consuming CRLF/`--` after a boundary, 2 = inside a part */
	#state: 0 | 1 | 2 = 0;
	#done = false;

	constructor(contentType: string) {
		const boundary = extractBoundary(contentType);
		if (!boundary) {
			throw new Error(`No boundary found in Content-Type: ${contentType}`);
		}
		// Includes the preceding CRLF so it's not left attached to the part body.
		this.#delimiter = textEncoder.encode(`\r\n--${boundary}`);
	}

	/**
	 * Push a chunk of body bytes (call with no argument to flush at end of stream).
	 * Returns the raw bytes of any parts that completed as a result.
	 *
	 * Copying is linear: each byte is combined with the (bounded) carry once, staged once, and
	 * copied into the completed part once.
	 */
	push(chunk?: Uint8Array): Uint8Array[] {
		if (this.#done) {
			// Closing delimiter already seen; ignore any epilogue bytes.
			return [];
		}

		let data = chunk && chunk.byteLength ? combineUint8Arrays(this.#carry, chunk) : this.#carry;
		this.#carry = new Uint8Array(0);

		const parts: Uint8Array[] = [];

		for (;;) {
			if (this.#state === 0 || this.#state === 2) {
				const delimIndex = indexOfSubsequence(data, this.#delimiter, 0);

				if (delimIndex === -1) {
					// No complete delimiter: everything except a possible trailing partial delimiter
					// is preamble (state 0, discarded) or confirmed part bytes (state 2, retained).
					const safeLength = Math.max(0, data.byteLength - (this.#delimiter.byteLength - 1));
					if (this.#state === 2 && safeLength > 0) {
						this.#appendToPart(data.subarray(0, safeLength));
					}
					this.#carry = data.slice(safeLength);
					break;
				}

				if (this.#state === 2) {
					// [0, delimIndex) completes the part body (headers + data).
					this.#appendToPart(data.subarray(0, delimIndex));
					const partBody = this.#takePart();
					const headerEnd = indexOfSubsequence(partBody, HEADER_SEPARATOR, 0);
					if (headerEnd === -1) {
						throw new Error("Malformed multipart part: missing header/data separator");
					}
					parts.push(partBody.subarray(headerEnd + HEADER_SEPARATOR.byteLength));
				}
				// Consume the delimiter; decide next state from what follows it.
				data = data.slice(delimIndex + this.#delimiter.byteLength);
				this.#state = 1;
				continue;
			}

			// state === 1: just after a boundary marker. Expect CRLF (a part follows) or `--` (end).
			if (data.byteLength < 2) {
				this.#carry = data;
				break;
			}
			if (data[0] === 0x2d && data[1] === 0x2d) {
				// `--`: closing delimiter
				this.#done = true;
				return parts;
			}
			if (data[0] === CRLF[0] && data[1] === CRLF[1]) {
				data = data.slice(2);
				this.#state = 2;
				continue;
			}
			throw new Error("Malformed multipart body: expected CRLF or closing delimiter after boundary");
		}

		return parts;
	}

	/** Append confirmed part bytes, coalescing small appends into staging blocks. */
	#appendToPart(bytes: Uint8Array): void {
		this.#partLength += bytes.byteLength;

		if (bytes.byteLength >= STAGING_BLOCK_SIZE) {
			// Large chunk: keep it directly (it's a view into a buffer we own).
			this.#flushStaging();
			this.#partChunks.push(bytes);
			return;
		}

		let offset = 0;
		while (offset < bytes.byteLength) {
			if (!this.#staging) {
				this.#staging = new Uint8Array(STAGING_BLOCK_SIZE);
				this.#stagingLength = 0;
			}
			const toCopy = Math.min(STAGING_BLOCK_SIZE - this.#stagingLength, bytes.byteLength - offset);
			this.#staging.set(bytes.subarray(offset, offset + toCopy), this.#stagingLength);
			this.#stagingLength += toCopy;
			offset += toCopy;
			if (this.#stagingLength === STAGING_BLOCK_SIZE) {
				this.#partChunks.push(this.#staging);
				this.#staging = undefined;
			}
		}
	}

	#flushStaging(): void {
		if (this.#staging && this.#stagingLength > 0) {
			this.#partChunks.push(this.#staging.subarray(0, this.#stagingLength));
		}
		this.#staging = undefined;
		this.#stagingLength = 0;
	}

	/** Assemble and reset the in-progress part. Loop-based copy: the chunk count is unbounded-safe. */
	#takePart(): Uint8Array {
		this.#flushStaging();
		const out = new Uint8Array(this.#partLength);
		let offset = 0;
		for (const chunk of this.#partChunks) {
			out.set(chunk, offset);
			offset += chunk.byteLength;
		}
		this.#partChunks = [];
		this.#partLength = 0;
		return out;
	}
}

export function extractBoundary(contentType: string): string | null {
	for (const part of contentType.split(";")) {
		const trimmed = part.trim();
		if (trimmed.toLowerCase().startsWith("boundary=")) {
			return trimmed.slice("boundary=".length).replace(/^"|"$/g, "");
		}
	}
	return null;
}
