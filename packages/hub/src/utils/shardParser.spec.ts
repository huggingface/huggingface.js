import { parseShardData } from "./shardParser";
import { readFile } from "fs/promises";
import { expect, describe, it } from "vitest";
import { init, compute_hmac } from "../vendor/xet-chunk/chunker_wasm";

describe("shardParser", () => {
	it("should parse a shard", async () => {
		const shard = await parseShardData(new Blob([await readFile("tests/gpt2-64-8bits.tflite.shard")]));
		const expectedJson = JSON.parse(await readFile("tests/gpt2-64-8bits.tflite.shard.json", "utf-8"));

		expect(shard.hmacKey).toBe(expectedJson.hmac_key);
		expect(shard.xorbs.length).toEqual(expectedJson.xorbs.length);
		for (let i = 0; i < shard.xorbs.length; i++) {
			expect(shard.xorbs[i].hash).toEqual(expectedJson.xorbs[i].hash);
			expect(shard.xorbs[i].chunks.length).toEqual(expectedJson.xorbs[i].chunk_hashes.length);
			for (let j = 0; j < shard.xorbs[i].chunks.length; j++) {
				expect(shard.xorbs[i].chunks[j].hash).toEqual(expectedJson.xorbs[i].chunk_hashes[j]);
			}
		}

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
