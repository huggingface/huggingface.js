import { describe, it, expect } from "vitest";

import { slice } from "../src/utils";

describe("Test utility functions", () => {
	describe("Slice function", () => {
		const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		it("[:]", async () => {
			expect(slice(array)).toEqual(array);
		});
		it("[start:end]", async () => {
			expect(slice(array, 0, 3)).toEqual([0, 1, 2]);
			expect(slice(array, 0, 0)).toEqual([]);
			expect(slice(array, 0, 100)).toEqual(array);
			expect(slice(array, 100, 100)).toEqual([]);
		});
		it("[start:end:step]", async () => {
			expect(slice(array, 1, 4, 2)).toEqual([1, 3]);
			expect(slice(array, 1, 8, 3)).toEqual([1, 4, 7]);
			expect(slice(array, 1, 8, 10)).toEqual([1]);
		});
		it("[:end]", async () => {
			expect(slice(array, undefined, 3)).toEqual([0, 1, 2]);
			expect(slice(array, undefined, 15)).toEqual(array);
		});
		it("[:end:step]", async () => {
			expect(slice(array, undefined, 4, 2)).toEqual([0, 2]);
			expect(slice(array, undefined, 10, 3)).toEqual([0, 3, 6, 9]);
		});
		it("[start:]", async () => {
			expect(slice(array, 3)).toEqual([3, 4, 5, 6, 7, 8, 9]);
			expect(slice(array, 11)).toEqual([]);
		});
		it("[start::step]", async () => {
			expect(slice(array, 1, undefined, 2)).toEqual([1, 3, 5, 7, 9]);
			expect(slice(array, 10, undefined, 2)).toEqual([]);
		});
		it("[::step]", async () => {
			expect(slice(array, undefined, undefined, 2)).toEqual([0, 2, 4, 6, 8]);
		});
		it("[-start]", async () => {
			expect(slice(array, -3)).toEqual([7, 8, 9]);
			expect(slice(array, -10)).toEqual(array);
		});
		it("[-start:end]", async () => {
			expect(slice(array, -3, 9)).toEqual([7, 8]);
			expect(slice(array, -10, 10)).toEqual(array);
			expect(slice(array, -1, 5)).toEqual([]);
		});
		it("[-start:-end]", async () => {
			expect(slice(array, -3, -1)).toEqual([7, 8]);
			expect(slice(array, -1, -1)).toEqual([]);
			expect(slice(array, -3, -5)).toEqual([]);
			expect(slice(array, -100, -90)).toEqual([]);
			expect(slice(array, -100, -1)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
		});
		it("[-start:-end:step]", async () => {
			expect(slice(array, -3, -1, 2)).toEqual([7]);
		});
		it("[-start::step]", async () => {
			expect(slice(array, -3, undefined, 2)).toEqual([7, 9]);
		});
		it("[-start:]", async () => {
			expect(slice(array, -3, undefined)).toEqual([7, 8, 9]);
		});
		it("[-start::]", async () => {
			expect(slice(array, -3, undefined, undefined)).toEqual([7, 8, 9]);
		});
		it("[-start::-step]", async () => {
			expect(slice(array, -3, undefined, -1)).toEqual([7, 6, 5, 4, 3, 2, 1, 0]);
		});
	});
});
