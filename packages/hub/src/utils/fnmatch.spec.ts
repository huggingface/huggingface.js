import { describe, expect, it } from "vitest";
import { fnmatch } from "./fnmatch";

describe("fnmatch", () => {
	it("matches like Python's fnmatch", () => {
		expect(fnmatch("a/b/c.txt", "*.txt")).toBe(true);
		expect(fnmatch("a/b/c.txt", "a/*")).toBe(true);
		expect(fnmatch("c.txt", "c.tx?")).toBe(true);
		expect(fnmatch("c.txt", "c.t?")).toBe(false);
		expect(fnmatch("a.log", "[ab].log")).toBe(true);
		expect(fnmatch("c.log", "[!ab].log")).toBe(true);
		expect(fnmatch("a.log", "[!ab].log")).toBe(false);
		expect(fnmatch("a+b", "a+b")).toBe(true);
		expect(fnmatch("a.b", "a.b")).toBe(true);
		expect(fnmatch("axb", "a.b")).toBe(false);
		expect(fnmatch("a[", "a[")).toBe(true);
	});
});
