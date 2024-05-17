import { describe, it, expect } from "vitest";
import { WebBlob } from "./WebBlob";
import { sha256 } from "./sha256";

describe("sha256", () => {
	const resourceUrl = new URL(
		"https://huggingface.co/ngxson/tinyllama_split_test/resolve/main/stories15M-q8_0-00001-of-00003.gguf"
	);

	it("Calculate hash in nodejs", async () => {
		const blob = await WebBlob.create(resourceUrl, { cacheBelow: 0 });
		const iterator = sha256(blob, { useWebWorker: true });
		let res: IteratorResult<number, string>;
		do {
			res = await iterator.next();
		} while (!res.done);
		const sha = res.value;
		expect(sha).toBe("8a3a74042ae05dda34985dff2d49adf2ee3f9d0fd73b03fa6cc4307c924e4040");
	});

	// TODO: how to test on browser (with / without web worker)
});
