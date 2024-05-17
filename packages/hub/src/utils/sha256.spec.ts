import { describe, it, expect } from "vitest";
import { WebBlob } from "./WebBlob";
import { sha256 } from "./sha256";

describe("sha256", () => {
	const SMALL_FILE_URL = new URL(
		"https://huggingface.co/ngxson/tinyllama_split_test/resolve/main/README.md"
	);
	const SMALL_FILE_SHA256 = "3e0e15fa0c5cc81675bd69af8eb469d128a725c1a7bfc71f03b7877b7b650567";
	const BIG_FILE_URL = new URL(
		"https://huggingface.co/ngxson/tinyllama_split_test/resolve/main/stories15M-q8_0-00001-of-00003.gguf"
	);
	const BIG_FILE_SHA256 = "8a3a74042ae05dda34985dff2d49adf2ee3f9d0fd73b03fa6cc4307c924e4040";

	async function calcSHA256(url: URL, useWebWorker: boolean) {
		const blob = await WebBlob.create(url, { cacheBelow: 0 });
		const iterator = sha256(blob, { useWebWorker });
		let res: IteratorResult<number, string>;
		do {
			res = await iterator.next();
		} while (!res.done);
		return res.value;
	}

	it("Calculate hash of a small file (without web worker)", async () => {
		const sha = await calcSHA256(SMALL_FILE_URL, false);
		expect(sha).toBe(SMALL_FILE_SHA256);
	});

	it("Calculate hash of a big file (without web worker)", async () => {
		const sha = await calcSHA256(BIG_FILE_URL, false);
		expect(sha).toBe(BIG_FILE_SHA256);
	});

	it("Calculate hash of a small file (with web worker)", async () => {
		const sha = await calcSHA256(SMALL_FILE_URL, true);
		expect(sha).toBe(SMALL_FILE_SHA256);
	});

	it("Calculate hash of a big file (with web worker)", async () => {
		const sha = await calcSHA256(BIG_FILE_URL, true);
		expect(sha).toBe(BIG_FILE_SHA256);
	});
});
