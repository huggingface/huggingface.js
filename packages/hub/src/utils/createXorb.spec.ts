import { describe, expect, it, vi } from "vitest";
import { backtrackDedup, createXorbs, CurrentXorbInfo } from "./createXorbs";
import type { ShardData } from "./shardParser";
import { ChunkCache } from "./ChunkCache";

vi.mock("./xetWriteToken", () => ({
	xetWriteToken: async () => ({ casUrl: "https://cas.example", accessToken: "token" }),
}));

function randomBytes(size: number): Uint8Array {
	const bytes = new Uint8Array(size);
	for (let i = 0; i < size; i += 65_536) {
		crypto.getRandomValues(bytes.subarray(i, i + 65_536));
	}
	return bytes;
}

async function collectXorbs(files: Uint8Array[]): Promise<Uint8Array[]> {
	async function* source() {
		for (const [i, file] of files.entries()) {
			yield { content: new Blob([file]), path: `file${i}` };
		}
	}
	const xorbs: Uint8Array[] = [];
	for await (const event of createXorbs(source(), {
		fetch: async () => new Response(null, { status: 404 }),
		accessToken: undefined,
		hubUrl: "https://hub.example",
		xetParams: { refreshWriteTokenUrl: "https://hub.example/refresh" },
	} as Parameters<typeof createXorbs>[1])) {
		if (event.event === "xorb") {
			xorbs.push(event.xorb);
		}
	}
	return xorbs;
}

describe("createXorb", () => {
	describe("backtrackDedup", () => {
		it("should update cache info for chunks that go back due to previous chunks being erased", () => {
			const xorb = new CurrentXorbInfo();

			const chunkMetadata = [
				{
					xorbId: xorb.id,
					chunkIndex: 0,
					length: 101,
				},
				{
					xorbId: xorb.id,
					chunkIndex: 1,
					length: 101,
				},
			];
			xorb.chunks = [
				{
					hash: "chunk1",
					length: 101,
					offset: 0,
				},
				{
					hash: "chunk2",
					length: 101,
					offset: 101,
				},
			];
			const shardData: ShardData = {
				hmacKey: "shard1",
				xorbs: [
					{
						hash: "remoteXorb1",
						chunks: [
							{
								hash: "chunk0:shard1",
								startOffset: 0,
								unpackedLength: 100,
							},
							{
								hash: "chunk1:shard1",
								startOffset: 100,
								unpackedLength: 101,
							},
						],
					},
				],
			};

			const computeHmac = (hash: string, key: string) => {
				return hash + ":" + key;
			};

			const chunkCache = new ChunkCache();
			let chunkIndex = 0;
			for (const chunk of xorb.chunks) {
				chunkCache.addChunkToCache(chunk.hash, xorb.id, chunkIndex++, shardData.hmacKey);
			}
			let xorbIndex = 0;
			for (const xorb of shardData.xorbs) {
				xorbIndex--;
				for (let i = 0; i < xorb.chunks.length; i++) {
					chunkCache.addChunkToCache(xorb.chunks[i].hash, xorbIndex, i, shardData.hmacKey);
				}
			}
			const dedup = backtrackDedup(xorb, computeHmac, shardData, chunkCache, chunkMetadata, 0);
			expect(dedup).toBe(101);
			expect(xorb.chunks).toEqual([{ hash: "chunk2", length: 101, offset: 0 }]);
			expect(chunkMetadata).toEqual([
				{
					xorbId: -1,
					chunkIndex: 1,
					length: 101,
				},
				{
					xorbId: 0,
					chunkIndex: 0,
					length: 101,
				},
			]);
			// chunk1 should use remote hash now
			expect(chunkCache.getChunk("chunk1", computeHmac)).toEqual({ xorbIndex: -1, chunkIndex: 1 });
			// The xorb index for chunk2 should be 0 now that the previous chunk was erased from the xorb
			expect(chunkCache.getChunk("chunk2", computeHmac)).toEqual({ xorbIndex: 0, chunkIndex: 0 });
		});
	});

	describe("xorb buffer allocation", () => {
		it("should not allocate a full-size xorb buffer for small files", async () => {
			const xorbs = await collectXorbs([randomBytes(1_000)]);
			expect(xorbs).toHaveLength(1);
			expect(xorbs[0].buffer.byteLength).toBeLessThan(10_000);
		});

		it("should grow the xorb buffer for many small files", async () => {
			const files = Array.from({ length: 50 }, () => randomBytes(20_000));
			const xorbs = await collectXorbs(files);
			expect(xorbs).toHaveLength(1);
			expect(xorbs[0].length).toBeGreaterThan(50 * 20_000);
			expect(xorbs[0].buffer.byteLength).toBeLessThan(4 * 50 * 20_000);
		});
	});
});
