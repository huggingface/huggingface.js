import { parseShardData } from "./shardParser";
import { readFile } from "fs/promises";
import { expect, describe, it } from "vitest";
import { init, compute_hmac } from "../vendor/xet-chunk/chunker_wasm";

describe("shardParser", () => {
	it("should parse a shard", async () => {
		const shard = await parseShardData(new Blob([await readFile("tests/gpt2-64-8bits.tflite.shard")]));
		// console.log(inspect(shard, { depth: null }));
		expect(shard.xorbs.length).toBeGreaterThan(2);

		console.log("xorbs", shard.xorbs.length);

		// const firstXorb = shard.xorbs[0];
		// const secondXorb = shard.xorbs[1];

		// console.log(firstXorb.chunks.slice(0, 10));
		// console.log(secondXorb.chunks.slice(0, 10));

		expect(shard.hmacKey).toBe("16af3a84044b83d6be998a42e20399f2cc5650eaf99950639f50418aece7954e");

		await init();

		const chunkHash = "9502eec19d4b0c9f7b389228fa801f68ecdf15d69ccd1da2f9ddbd0219898335";
		const xorb = shard.xorbs.find((xorb) =>
			xorb.chunks.some((chunk) => compute_hmac(chunk.hash, shard.hmacKey) === chunkHash)
		);
		expect(xorb).toBeDefined();
		expect(xorb?.chunks.length).toBe(1);
		expect(xorb?.chunks[0].startOffset).toBe(0);
		expect(xorb?.chunks[0].unpackedLength).toBe(1024);
	});
});
