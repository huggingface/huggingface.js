import { describe, it, expect } from "vitest";
import { sha256 } from "./sha256";

const smallContent = "hello world";
const smallContentSHA256 = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
const bigContent = "O123456789".repeat(100_000);
const bigContentSHA256 = "a3bbce7ee1df7233d85b5f4d60faa3755f93f537804f8b540c72b0739239ddf8";

describe("sha256", () => {
	async function calcSHA256(content: string, useWebWorker: boolean) {
		const iterator = sha256(new Blob([content]), { useWebWorker });
		let res: IteratorResult<number, string>;
		do {
			res = await iterator.next();
		} while (!res.done);
		return res.value;
	}

	it("Calculate hash of a small file (without web worker)", async () => {
		const sha = await calcSHA256(smallContent, false);
		expect(sha).toBe(smallContentSHA256);
	});

	it("Calculate hash of a big file (without web worker)", async () => {
		const sha = await calcSHA256(bigContent, false);
		expect(sha).toBe(bigContentSHA256);
	});

	it("Calculate hash of a small file (with web worker)", async () => {
		const sha = await calcSHA256(smallContent, true);
		expect(sha).toBe(smallContentSHA256);
	});

	it("Calculate hash of a big file (with web worker)", async () => {
		const sha = await calcSHA256(bigContent, true);
		expect(sha).toBe(bigContentSHA256);
	});
});
