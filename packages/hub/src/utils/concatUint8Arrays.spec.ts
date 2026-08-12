import { describe, expect, it } from "vitest";
import { concatUint8Arrays } from "./concatUint8Arrays";

describe("concatUint8Arrays", () => {
	it("concatenates arrays", () => {
		expect(concatUint8Arrays([new Uint8Array([1, 2]), new Uint8Array([]), new Uint8Array([3])])).toEqual(
			new Uint8Array([1, 2, 3]),
		);
	});

	it("handles an empty list", () => {
		expect(concatUint8Arrays([])).toEqual(new Uint8Array([]));
	});

	it("handles more chunks than the max argument count", () => {
		const chunks = Array.from({ length: 200_000 }, (_, i) => new Uint8Array([i % 256]));
		const result = concatUint8Arrays(chunks);
		expect(result.byteLength).toBe(200_000);
		expect(result[199_999]).toBe(199_999 % 256);
	});
});
