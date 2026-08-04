import { combineUint8Arrays } from "./combineUint8Arrays";
import { indexOfSubsequence } from "./indexOfSubsequence";

const textEncoder = new TextEncoder();
const CRLF = textEncoder.encode("\r\n");
const DASH_DASH = textEncoder.encode("--");
const HEADER_SEPARATOR = textEncoder.encode("\r\n\r\n");

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
	#buffer = new Uint8Array(0);
	/** 0 = scanning for first boundary, 1 = consuming CRLF/`--` after a boundary, 2 = inside a part */
	#state: 0 | 1 | 2 = 0;
	#done = false;

	constructor(contentType: string) {
		const boundary = extractBoundary(contentType);
		if (!boundary) {
			throw new Error(`No boundary found in Content-Type: ${contentType}`);
		}
		// Include the preceding CRLF in the delimiter so it's not left attached to the part body.
		// (The first delimiter's CRLF is body preamble and is discarded in state 0.)
		this.#delimiter = textEncoder.encode(`\r\n--${boundary}`);
	}

	/**
	 * Push a chunk of body bytes (call with no argument to flush at end of stream).
	 * Returns the raw bytes of any parts that completed as a result.
	 */
	push(chunk?: Uint8Array): Uint8Array[] {
		if (this.#done) {
			// Closing delimiter already seen; ignore any epilogue bytes.
			return [];
		}
		if (chunk && chunk.byteLength) {
			this.#buffer = combineUint8Arrays(this.#buffer, chunk);
		}

		const parts: Uint8Array[] = [];

		for (;;) {
			if (this.#state === 0 || this.#state === 2) {
				const delimIndex = indexOfSubsequence(this.#buffer, this.#delimiter, 0);

				if (delimIndex === -1) {
					if (this.#state === 0) {
						// Discard preamble, keeping only a possible trailing partial delimiter.
						const keep = this.#delimiter.byteLength - 1;
						if (this.#buffer.byteLength > keep) {
							this.#buffer = this.#buffer.slice(this.#buffer.byteLength - keep);
						}
					}
					// In state 2 the buffer holds in-progress part data; wait for more bytes.
					break;
				}

				if (this.#state === 2) {
					// Everything before the delimiter is the part body (headers + data).
					const partBody = this.#buffer.slice(0, delimIndex);
					const headerEnd = indexOfSubsequence(partBody, HEADER_SEPARATOR, 0);
					if (headerEnd === -1) {
						throw new Error("Malformed multipart part: missing header/data separator");
					}
					parts.push(partBody.slice(headerEnd + HEADER_SEPARATOR.byteLength));
				}
				// Consume the delimiter; move to post-boundary state.
				this.#buffer = this.#buffer.slice(delimIndex + this.#delimiter.byteLength);
				this.#state = 1;
				continue;
			}

			// state === 1: just after a boundary marker. Expect CRLF (a part follows) or `--` (end).
			// A leading `\r\n` may precede the first delimiter in the body, so also tolerate CRLF here.
			if (this.#buffer.byteLength < 2) {
				break; // need more bytes to decide
			}
			if (this.#buffer[0] === DASH_DASH[0] && this.#buffer[1] === DASH_DASH[1]) {
				this.#done = true;
				this.#buffer = new Uint8Array(0);
				return parts;
			}
			if (this.#buffer[0] === CRLF[0] && this.#buffer[1] === CRLF[1]) {
				this.#buffer = this.#buffer.slice(2);
				this.#state = 2;
				continue;
			}
			throw new Error("Malformed multipart body: expected CRLF or closing delimiter after boundary");
		}

		return parts;
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
