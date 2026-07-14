import { describe, expect, it } from "vitest";
import { extractBoundary, parseMultipartByteRanges } from "./multipart";

const enc = new TextEncoder();

function concat(...arrays: Uint8Array[]): Uint8Array {
	const total = arrays.reduce((sum, a) => sum + a.byteLength, 0);
	const out = new Uint8Array(total);
	let offset = 0;
	for (const a of arrays) {
		out.set(a, offset);
		offset += a.byteLength;
	}
	return out;
}

function buildPart(
	boundary: string,
	range: { start: number; end: number },
	total: number,
	data: Uint8Array,
): Uint8Array {
	return concat(
		enc.encode(`--${boundary}\r\n`),
		enc.encode(`Content-Type: application/octet-stream\r\n`),
		enc.encode(`Content-Range: bytes ${range.start}-${range.end}/${total}\r\n\r\n`),
		data,
	);
}

describe("multipart", () => {
	describe("extractBoundary", () => {
		it("extracts an unquoted boundary", () => {
			expect(extractBoundary("multipart/byteranges; boundary=something")).toBe("something");
		});

		it("extracts a quoted boundary", () => {
			expect(extractBoundary('multipart/byteranges; boundary="quoted"')).toBe("quoted");
		});

		it("returns null when there is no boundary", () => {
			expect(extractBoundary("multipart/byteranges")).toBeNull();
		});
	});

	describe("parseMultipartByteRanges", () => {
		it("parses multiple parts and preserves their data", () => {
			const boundary = "BOUNDARY";
			const data0 = new Uint8Array([1, 2, 3, 4, 5]);
			const data1 = new Uint8Array([10, 20, 30]);

			const body = concat(
				buildPart(boundary, { start: 0, end: 4 }, 100, data0),
				enc.encode("\r\n"),
				buildPart(boundary, { start: 50, end: 52 }, 100, data1),
				enc.encode(`\r\n--${boundary}--\r\n`),
			);

			const parts = parseMultipartByteRanges(`multipart/byteranges; boundary=${boundary}`, body);

			expect(parts).toHaveLength(2);
			expect(parts[0].range).toEqual({ start: 0, end: 4 });
			expect(Array.from(parts[0].data)).toEqual([1, 2, 3, 4, 5]);
			expect(parts[1].range).toEqual({ start: 50, end: 52 });
			expect(Array.from(parts[1].data)).toEqual([10, 20, 30]);
		});

		it("sorts parts by byte range start", () => {
			const boundary = "abc";
			const body = concat(
				buildPart(boundary, { start: 50, end: 51 }, 100, new Uint8Array([9, 9])),
				enc.encode("\r\n"),
				buildPart(boundary, { start: 0, end: 1 }, 100, new Uint8Array([1, 1])),
				enc.encode(`\r\n--${boundary}--\r\n`),
			);

			const parts = parseMultipartByteRanges(`multipart/byteranges; boundary=${boundary}`, body);

			expect(parts.map((p) => p.range.start)).toEqual([0, 50]);
		});

		it("handles binary data containing CR/LF bytes", () => {
			const boundary = "xyz";
			const data = new Uint8Array([0x0d, 0x0a, 0x00, 0x2d, 0x2d, 0xff]);
			const body = concat(buildPart(boundary, { start: 0, end: 5 }, 6, data), enc.encode(`\r\n--${boundary}--\r\n`));

			const parts = parseMultipartByteRanges(`multipart/byteranges; boundary=${boundary}`, body);

			expect(parts).toHaveLength(1);
			expect(Array.from(parts[0].data)).toEqual([0x0d, 0x0a, 0x00, 0x2d, 0x2d, 0xff]);
		});

		it("throws when the boundary is missing from the body", () => {
			expect(() => parseMultipartByteRanges("multipart/byteranges; boundary=nope", enc.encode("garbage"))).toThrow();
		});

		it("throws when the content type has no boundary", () => {
			expect(() => parseMultipartByteRanges("multipart/byteranges", new Uint8Array())).toThrow();
		});
	});
});
