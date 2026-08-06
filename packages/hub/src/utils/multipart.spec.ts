import { describe, expect, it } from "vitest";
import { combineUint8Arrays } from "./combineUint8Arrays";
import { StreamingMultipartParser } from "./multipart";

const enc = new TextEncoder();

function buildMultipart(boundary: string, parts: Uint8Array[]): Uint8Array {
	const segments: Uint8Array[] = [];
	for (const data of parts) {
		segments.push(enc.encode(`\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`), data);
	}
	segments.push(enc.encode(`\r\n--${boundary}--\r\n`));
	return combineUint8Arrays(...segments);
}

describe("StreamingMultipartParser", () => {
	const boundary = "BOUNDARY";
	const contentType = `multipart/byteranges; boundary=${boundary}`;

	it("parses all parts fed as one chunk", () => {
		const parts = [enc.encode("hello"), enc.encode("world"), new Uint8Array([1, 2, 3])];
		const body = buildMultipart(boundary, parts);
		const parser = new StreamingMultipartParser(contentType);
		const out = parser.push(body);
		expect(out.map((p) => Array.from(p))).toEqual(parts.map((p) => Array.from(p)));
	});

	it("parses parts fed one byte at a time", () => {
		const parts = [enc.encode("hello"), enc.encode("world!")];
		const body = buildMultipart(boundary, parts);
		const parser = new StreamingMultipartParser(contentType);
		const out: Uint8Array[] = [];
		for (const byte of body) {
			out.push(...parser.push(new Uint8Array([byte])));
		}
		expect(out.map((p) => Array.from(p))).toEqual(parts.map((p) => Array.from(p)));
	});

	it("handles a boundary straddling chunk boundaries", () => {
		const parts = [enc.encode("abc"), enc.encode("defgh")];
		const body = buildMultipart(boundary, parts);
		// Split at every possible point and re-parse
		for (let split = 0; split <= body.byteLength; split++) {
			const parser = new StreamingMultipartParser(contentType);
			const out = [...parser.push(body.slice(0, split)), ...parser.push(body.slice(split))];
			expect(
				out.map((p) => Array.from(p)),
				`split at ${split}`,
			).toEqual(parts.map((p) => Array.from(p)));
		}
	});

	it("coalesces tiny pushes on a part spanning multiple staging blocks", () => {
		// ~200KB part (> 3 staging blocks of 64KB) with a recognizable pattern.
		const partData = new Uint8Array(200_000).map((_, i) => i % 251);
		const body = buildMultipart(boundary, [partData]);

		for (const feedSize of [1, 3, 7, 1024]) {
			const parser = new StreamingMultipartParser(contentType);
			const out: Uint8Array[] = [];
			for (let off = 0; off < body.byteLength; off += feedSize) {
				out.push(...parser.push(body.subarray(off, Math.min(off + feedSize, body.byteLength))));
			}
			expect(out.length, `feed size ${feedSize}`).toBe(1);
			expect(out[0].byteLength, `feed size ${feedSize}`).toBe(partData.byteLength);
			expect(Buffer.from(out[0]).equals(Buffer.from(partData)), `feed size ${feedSize}`).toBe(true);
		}
	});

	it("parses a body whose first boundary has no leading CRLF", () => {
		// RFC 2046 §5.1.1: the CRLF preceding the first delimiter is "considered part of the
		// preamble" — a body may start directly with `--boundary` (as in the RFC 9110 example).
		const parts = [enc.encode("hello"), enc.encode("world")];
		const body = buildMultipart(boundary, parts).slice(2); // strip the leading \r\n
		expect(Array.from(body.slice(0, 2))).toEqual(Array.from(enc.encode("--")));

		// Whole-body and every-split-point feeds
		for (let split = 0; split <= body.byteLength; split++) {
			const parser = new StreamingMultipartParser(contentType);
			const out = [...parser.push(body.slice(0, split)), ...parser.push(body.slice(split))];
			expect(
				out.map((p) => Array.from(p)),
				`split at ${split}`,
			).toEqual(parts.map((p) => Array.from(p)));
		}
	});

	it("handles binary data containing CR/LF and dash bytes", () => {
		const parts = [new Uint8Array([0x0d, 0x0a, 0x2d, 0x2d, 0xff, 0x0d, 0x0a])];
		const body = buildMultipart(boundary, parts);
		const parser = new StreamingMultipartParser(contentType);
		const out = parser.push(body);
		expect(out.map((p) => Array.from(p))).toEqual(parts.map((p) => Array.from(p)));
	});

	it("streams parts out incrementally without waiting for the whole body", () => {
		const parts = [enc.encode("first-part"), enc.encode("second-part")];
		const body = buildMultipart(boundary, parts);
		// Feed only up to just past the first part's data
		const firstEnd = indexOf(body, enc.encode("second-part"));
		const parser = new StreamingMultipartParser(contentType);
		const out = parser.push(body.slice(0, firstEnd));
		// The first part should already be emitted even though part 2 hasn't fully arrived
		expect(out.length).toBe(1);
		expect(Array.from(out[0])).toEqual(Array.from(parts[0]));
	});

	it("throws when there is no boundary in the content type", () => {
		expect(() => new StreamingMultipartParser("multipart/byteranges")).toThrow();
	});

	it("throws on malformed body (no closing structure)", () => {
		const parser = new StreamingMultipartParser(contentType);
		expect(() => parser.push(enc.encode("garbage with no boundary at all"))).not.toThrow(); // tolerated as preamble
	});

	function indexOf(haystack: Uint8Array, needle: Uint8Array): number {
		outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
			for (let j = 0; j < needle.length; j++) {
				if (haystack[i + j] !== needle[j]) {
					continue outer;
				}
			}
			return i;
		}
		return -1;
	}
});
