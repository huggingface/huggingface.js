/**
 * A single part from a `multipart/byteranges` HTTP response.
 */
export interface MultipartPart {
	/** Byte range covered by this part, inclusive end (as in the `Content-Range` header). */
	range: { start: number; end: number };
	data: Uint8Array;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function extractBoundary(contentType: string): string | null {
	for (const part of contentType.split(";")) {
		const trimmed = part.trim();
		if (trimmed.toLowerCase().startsWith("boundary=")) {
			return trimmed.slice("boundary=".length).replace(/^"|"$/g, "");
		}
	}
	return null;
}

function indexOfSubsequence(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
	outer: for (let i = from; i <= haystack.length - needle.length; i++) {
		for (let j = 0; j < needle.length; j++) {
			if (haystack[i + j] !== needle[j]) {
				continue outer;
			}
		}
		return i;
	}
	return -1;
}

function parseContentRange(headers: string): { start: number; end: number } | null {
	for (const line of headers.split("\r\n")) {
		const lower = line.toLowerCase();
		if (lower.startsWith("content-range:")) {
			// Content-Range: bytes <start>-<end>/<total>
			const value = line.slice("content-range:".length).trim();
			const match = value.match(/^bytes\s+(\d+)-(\d+)\//i);
			if (match) {
				// RFC 7233 Content-Range uses an inclusive end.
				return { start: parseInt(match[1], 10), end: parseInt(match[2], 10) };
			}
		}
	}
	return null;
}

/**
 * Parse a `multipart/byteranges` HTTP response body (RFC 7233 §4.1).
 *
 * Extracts the boundary from `contentType`, splits the body by boundary markers,
 * parses the `Content-Range` header from each part, and returns parts sorted by byte range start.
 *
 * Ported from xet-core's `parse_multipart_byteranges`.
 */
export function parseMultipartByteRanges(contentType: string, body: Uint8Array): MultipartPart[] {
	const boundary = extractBoundary(contentType);
	if (!boundary) {
		throw new Error(`No boundary found in Content-Type: ${contentType}`);
	}

	const firstDelim = textEncoder.encode(`--${boundary}`);
	const delimiter = textEncoder.encode(`\r\n--${boundary}`);
	const crlf = textEncoder.encode("\r\n");
	const headerSeparator = textEncoder.encode("\r\n\r\n");

	const start = indexOfSubsequence(body, firstDelim);
	if (start === -1) {
		throw new Error("No boundary found in multipart body");
	}

	const parts: MultipartPart[] = [];
	let pos = start + firstDelim.length;

	for (;;) {
		// Each part starts with CRLF after the boundary marker. Anything else (eg `--` for the
		// closing delimiter) ends the message.
		if (body[pos] === crlf[0] && body[pos + 1] === crlf[1]) {
			pos += 2;
		} else {
			break;
		}

		const nextBoundary = indexOfSubsequence(body, delimiter, pos);
		const partEnd = nextBoundary === -1 ? body.length : nextBoundary;
		const partData = body.subarray(pos, partEnd);

		const headerEnd = indexOfSubsequence(partData, headerSeparator);
		if (headerEnd === -1) {
			throw new Error("Malformed multipart part: missing header/data separator");
		}

		const headers = textDecoder.decode(partData.subarray(0, headerEnd));
		const range = parseContentRange(headers);
		if (!range) {
			throw new Error("No Content-Range header found in multipart part");
		}

		parts.push({
			range,
			data: partData.subarray(headerEnd + headerSeparator.length),
		});

		if (nextBoundary === -1) {
			break;
		}
		pos = nextBoundary + delimiter.length;
	}

	parts.sort((a, b) => a.range.start - b.range.start);

	return parts;
}
