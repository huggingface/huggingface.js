import { describe, it, expect } from "vitest";

import { slice, strftime, replace } from "../src/utils";

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

	describe("strftime function", () => {
		const date = new Date(2025, 5, 4, 12, 34, 56);
		const leapDate = new Date(2000, 1, 29, 0, 0, 0, 0);

		it('should format "%d %b %Y"', () => {
			expect(strftime(date, "%d %b %Y")).toEqual("04 Jun 2025");
			expect(strftime(leapDate, "%d %b %Y")).toEqual("29 Feb 2000");
		});

		it('should format "%Y-%m-%d"', () => {
			expect(strftime(date, "%Y-%m-%d")).toEqual("2025-06-04");
			expect(strftime(leapDate, "%Y-%m-%d")).toEqual("2000-02-29");
		});

		it("should format '%B %d, %Y'", () => {
			expect(strftime(date, "%B %d, %Y")).toEqual("June 04, 2025");
			expect(strftime(leapDate, "%B %d, %Y")).toEqual("February 29, 2000");
		});
	});

	describe("replace function", () => {
		it("replaces all occurrences when count is not specified", () => {
			expect(replace("one one one", "one", "two")).toEqual("two two two");
			expect(replace("aaaa", "a", "b")).toEqual("bbbb");
		});

		it("replaces up to count occurrences when count is provided", () => {
			expect(replace("spam spam spam", "spam", "eggs", 2)).toEqual("eggs eggs spam");
			expect(replace("abcabcabc", "abc", "x", 0)).toEqual("abcabcabc");
		});

		it("removes occurrences when replacement is empty", () => {
			expect(replace("foo bar foo", "foo", "")).toEqual(" bar ");
			expect(replace("banana", "a", "")).toEqual("bnn");
		});

		it("returns original when old substring not found", () => {
			expect(replace("hello world", "xyz", "123")).toEqual("hello world");
		});

		it("handles overlapping patterns like Python does", () => {
			// Python.replace treats non-overlapping matches: "aaaa".replace("aa","b") => "bb"
			expect(replace("aaaa", "aa", "b")).toEqual("bb");
		});

		it("handles when old substring is empty", () => {
			expect(replace("abc", "", "x")).toEqual("xaxbxcx");
			expect(replace("abc", "", "x", 0)).toEqual("abc");
			expect(replace("abc", "", "x", 2)).toEqual("xaxbc");
			expect(replace("abc", "", "x", 100)).toEqual("xaxbxcx");
		});

		it("handles multi-byte characters", () => {
			const str = "🤗test🤗"; // \ud83e\udd17
			expect(replace(str, "test", "🤗")).toEqual("🤗🤗🤗");
			expect(replace(str, "\ud83e", "X")).toEqual(str); // No replacement
		});
	});
});
