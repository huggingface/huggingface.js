import { describe, expect, it } from "vitest";
import { indexOfSubsequence } from "./indexOfSubsequence";

const enc = new TextEncoder();

describe("indexOfSubsequence", () => {
	it("finds a subsequence", () => {
		expect(indexOfSubsequence(enc.encode("hello world"), enc.encode("world"))).toBe(6);
	});

	it("finds binary subsequences", () => {
		expect(indexOfSubsequence(new Uint8Array([1, 2, 3, 4, 3, 4, 5]), new Uint8Array([3, 4, 5]))).toBe(4);
	});

	it("returns -1 when not found", () => {
		expect(indexOfSubsequence(enc.encode("hello"), enc.encode("goodbye"))).toBe(-1);
	});

	it("respects the from offset", () => {
		expect(indexOfSubsequence(enc.encode("abab"), enc.encode("ab"), 1)).toBe(2);
	});

	it("finds a match at the start", () => {
		expect(indexOfSubsequence(enc.encode("abc"), enc.encode("abc"))).toBe(0);
	});

	it("returns -1 when the needle is longer than the haystack", () => {
		expect(indexOfSubsequence(enc.encode("ab"), enc.encode("abc"))).toBe(-1);
	});

	it("finds overlapping matches correctly", () => {
		expect(indexOfSubsequence(enc.encode("aaaa"), enc.encode("aa"))).toBe(0);
		expect(indexOfSubsequence(enc.encode("aaaa"), enc.encode("aa"), 1)).toBe(1);
	});

	it("handles an empty needle", () => {
		expect(indexOfSubsequence(enc.encode("abc"), enc.encode(""))).toBe(0);
		expect(indexOfSubsequence(enc.encode("abc"), enc.encode(""), 2)).toBe(2);
	});

	it("doesn't get fooled by repeated prefixes in the needle", () => {
		// "aab" inside "aaab": naive bad-skip could miss the match at index 1
		expect(indexOfSubsequence(enc.encode("aaab"), enc.encode("aab"))).toBe(1);
		expect(indexOfSubsequence(enc.encode("abcabcabc"), enc.encode("abcab"), 1)).toBe(3);
	});

	it("matches a brute-force search on random inputs", () => {
		const brute = (h: Uint8Array, n: Uint8Array, from = 0) => {
			outer: for (let i = from; i <= h.length - n.length; i++) {
				for (let j = 0; j < n.length; j++) {
					if (h[i + j] !== n[j]) {
						continue outer;
					}
				}
				return i;
			}
			return -1;
		};

		let seed = 42;
		const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff);
		for (let trial = 0; trial < 200; trial++) {
			const h = new Uint8Array(rand() % 200).map(() => rand() % 8); // small alphabet => many repeats
			const n = new Uint8Array(1 + (rand() % 12)).map(() => rand() % 8);
			const from = rand() % (h.length + 1);
			expect(indexOfSubsequence(h, n, from)).toBe(brute(h, n, from));
		}
	});
});
