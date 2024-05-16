import { describe, it, expect } from "vitest";
import { WebBlob } from "./WebBlob";
import { sha256 } from "./sha256";

describe("sha256", () => {
	const resourceUrl = new URL("https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json");

	it("calculate hash", async () => {
		const blob = await WebBlob.create(resourceUrl, { cacheBelow: 0 });
		const iterator = sha256(blob, { useWebWorker: true });
		let res: IteratorResult<number, string>;
		do {
			res = await iterator.next();
		} while (!res.done);
		const sha = res.value;
		expect(sha).toBe('467ac6467222c5ab45e4bc14c9886506bb99e239058110f0f08926904f29a0f5');
	});
});
