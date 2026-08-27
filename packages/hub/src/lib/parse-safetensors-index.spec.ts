import { describe, expect, it } from "vitest";
import { parseSafetensorsIndexStream, SafetensorsIndexParseError } from "./parse-safetensors-index";

const encoder = new TextEncoder();

function toStream(text: string, chunkSize = 64 * 1024): ReadableStream<Uint8Array> {
	const bytes = encoder.encode(text);
	let offset = 0;
	return new ReadableStream<Uint8Array>({
		pull(controller) {
			if (offset >= bytes.length) {
				controller.close();
				return;
			}
			controller.enqueue(bytes.slice(offset, Math.min(offset + chunkSize, bytes.length)));
			offset += chunkSize;
		},
	});
}

/** Builds an index with `tensorCount` tensors spread over `shardCount` shards. */
function makeIndex(tensorCount: number, shardCount: number, metadata?: Record<string, unknown>): string {
	const weightMap: Record<string, string> = {};
	for (let i = 0; i < tensorCount; i++) {
		const shard = String((i % shardCount) + 1).padStart(5, "0");
		weightMap[`model.layers.${i}.weight`] = `model-${shard}-of-${String(shardCount).padStart(5, "0")}.safetensors`;
	}
	return JSON.stringify({ ...(metadata ? { metadata } : {}), weight_map: weightMap });
}

describe("parseSafetensorsIndexStream", () => {
	it("extracts metadata and distinct shard filenames", async () => {
		const text = makeIndex(10, 3, { total_size: 123456, total_parameters: "789" });

		const result = await parseSafetensorsIndexStream(toStream(text));

		expect(result.metadata).toEqual({ total_size: 123456, total_parameters: "789" });
		expect(result.shardFilenames).toEqual([
			"model-00001-of-00003.safetensors",
			"model-00002-of-00003.safetensors",
			"model-00003-of-00003.safetensors",
		]);
		expect(result.weightMapEntryCount).toBe(10);
		expect(result.weightMap).toEqual(JSON.parse(text).weight_map);
	});

	it("picks up dtype when present", async () => {
		const result = await parseSafetensorsIndexStream(
			toStream(JSON.stringify({ dtype: "F16", weight_map: { "a.weight": "a.safetensors" } })),
		);
		expect(result.dtype).toBe("F16");
	});

	it("works without metadata", async () => {
		const result = await parseSafetensorsIndexStream(toStream(makeIndex(4, 2)));
		expect(result.metadata).toBeUndefined();
		expect(result.shardFilenames).toHaveLength(2);
	});

	it("handles an index whose keys come in an unexpected order", async () => {
		const text = JSON.stringify({
			weight_map: { "a.weight": "s1.safetensors" },
			dtype: "BF16",
			metadata: { total_parameters: 7 },
		});
		const result = await parseSafetensorsIndexStream(toStream(text));
		expect(result.dtype).toBe("BF16");
		expect(result.metadata).toEqual({ total_parameters: 7 });
		expect(result.shardFilenames).toEqual(["s1.safetensors"]);
	});

	it("ignores unknown root keys, including large nested ones", async () => {
		const text = JSON.stringify({
			metadata: { total_size: 1 },
			some_future_field: { nested: { deeply: Array.from({ length: 1000 }, (_, i) => i) } },
			another: [1, 2, 3],
			weight_map: { "a.weight": "s1.safetensors" },
		});
		const result = await parseSafetensorsIndexStream(toStream(text));
		expect(result.metadata).toEqual({ total_size: 1 });
		expect(result.shardFilenames).toEqual(["s1.safetensors"]);
		expect(result.weightMapEntryCount).toBe(1);
	});

	it("parses a Kimi-K3-shaped index that JSON.parse-after-25MB-slice cannot", async () => {
		// same shape as moonshotai/Kimi-K3: ~500k tensors over ~100 shards, tens of MB
		const shardCount = 96;
		const text = makeIndex(500_000, shardCount, { total_size: 1_560_000_000_000 });

		expect(text.length).toBeGreaterThan(25_000_000); // the old code path would truncate & throw
		expect(() => JSON.parse(text.slice(0, 25_000_000))).toThrow();

		const result = await parseSafetensorsIndexStream(toStream(text));

		expect(result.shardFilenames).toHaveLength(shardCount);
		expect(result.weightMapEntryCount).toBe(500_000);
		expect(result.metadata).toEqual({ total_size: 1_560_000_000_000 });
		// past MAX_WEIGHT_MAP_ENTRIES the map is intentionally not materialized
		expect(result.weightMap).toBeUndefined();
	});

	it("drops weightMap past maxWeightMapEntries but keeps shard filenames", async () => {
		const result = await parseSafetensorsIndexStream(toStream(makeIndex(100, 4)), {
			maxWeightMapEntries: 10,
		});
		expect(result.weightMap).toBeUndefined();
		expect(result.weightMapEntryCount).toBe(100);
		expect(result.shardFilenames).toHaveLength(4);
	});

	it("keeps weightMap when exactly at maxWeightMapEntries", async () => {
		const result = await parseSafetensorsIndexStream(toStream(makeIndex(10, 2)), { maxWeightMapEntries: 10 });
		expect(Object.keys(result.weightMap ?? {})).toHaveLength(10);
	});

	it("enforces maxShardCount", async () => {
		await expect(parseSafetensorsIndexStream(toStream(makeIndex(50, 20)), { maxShardCount: 5 })).rejects.toThrow(
			/Too many shard files/,
		);
	});

	it("enforces maxBytes", async () => {
		await expect(parseSafetensorsIndexStream(toStream(makeIndex(10_000, 4)), { maxBytes: 1000 })).rejects.toThrow(
			/too big/,
		);
	});

	it("rejects a non-object index", async () => {
		await expect(parseSafetensorsIndexStream(toStream("[1,2,3]"))).rejects.toThrow(SafetensorsIndexParseError);
		await expect(parseSafetensorsIndexStream(toStream('"nope"'))).rejects.toThrow(SafetensorsIndexParseError);
	});

	it("rejects malformed JSON", async () => {
		await expect(parseSafetensorsIndexStream(toStream('{"weight_map":{'))).rejects.toThrow();
		await expect(parseSafetensorsIndexStream(toStream("truncated"))).rejects.toThrow();
	});

	describe("hostile input", () => {
		// index.json is attacker-controlled: anyone can push one to a repo they own.

		it("rejects one enormous string instead of buffering it", async () => {
			// a tiny index whose single filename is 100MB
			const huge = "a".repeat(100_000_000);
			await expect(parseSafetensorsIndexStream(toStream(`{"weight_map":{"t":"${huge}"}}`))).rejects.toThrow(
				/maximum length/,
			);
		});

		it("rejects an enormous tensor name", async () => {
			const huge = "k".repeat(50_000_000);
			await expect(parseSafetensorsIndexStream(toStream(`{"weight_map":{"${huge}":"s.safetensors"}}`))).rejects.toThrow(
				/maximum length/,
			);
		});

		it("rejects deeply nested input", async () => {
			const text = `{"weight_map":${"[".repeat(50_000)}`;
			await expect(parseSafetensorsIndexStream(toStream(text))).rejects.toThrow(/nesting is deeper/);
		});

		it("rejects many distinct long filenames (retention budget)", async () => {
			// 1k distinct filenames x 60k chars each = ~60M retained chars, over the 48M budget.
			// Each filename is individually under MAX_TOKEN_LENGTH, so only the budget catches this.
			const entries: string[] = [];
			for (let i = 0; i < 1_000; i++) {
				entries.push(`"t${i}":"${"x".repeat(60_000)}${i}.safetensors"`);
			}
			await expect(
				parseSafetensorsIndexStream(toStream(`{"weight_map":{${entries.join(",")}}}`), {
					maxBytes: Infinity,
					maxShardCount: 1_000_000,
				}),
			).rejects.toThrow(/retains more than/);
		});

		it("tolerates the worst legitimate shard set well within the budget", async () => {
			// 10k shards (MAX_SHARD_COUNT) with long subfolder-qualified names
			const entries: string[] = [];
			for (let i = 0; i < 10_000; i++) {
				entries.push(`"t${i}":"${"nested/".repeat(4)}diffusion_pytorch_model-${i}-of-10000.safetensors"`);
			}
			const result = await parseSafetensorsIndexStream(toStream(`{"weight_map":{${entries.join(",")}}}`), {
				maxShardCount: 10_000,
			});
			expect(result.shardFilenames).toHaveLength(10_000);
		});

		it("drops (not rejects) a weight_map that is under the entry cap but too many chars", async () => {
			// 150k entries (< 200k cap) with long names, blowing MAX_WEIGHT_MAP_CHARS instead
			const entries: string[] = [];
			for (let i = 0; i < 150_000; i++) {
				entries.push(`"${"layer.".repeat(30)}${i}.weight":"s${i % 4}.safetensors"`);
			}
			const result = await parseSafetensorsIndexStream(toStream(`{"weight_map":{${entries.join(",")}}}`), {
				maxBytes: Infinity,
			});
			// degrades gracefully: the map goes, the data we need survives
			expect(result.weightMap).toBeUndefined();
			expect(result.weightMapEntryCount).toBe(150_000);
			expect(result.shardFilenames).toHaveLength(4);
		});

		it("rejects a huge metadata blob", async () => {
			const entries: string[] = [];
			for (let i = 0; i < 1_000; i++) {
				entries.push(`"k${i}":"${"v".repeat(99_000)}"`);
			}
			await expect(
				parseSafetensorsIndexStream(toStream(`{"metadata":{${entries.join(",")}}}`), { maxBytes: Infinity }),
			).rejects.toThrow(/retains more than/);
		});

		it("caps the number of metadata entries it keeps", async () => {
			const entries: string[] = [];
			for (let i = 0; i < 50_000; i++) {
				entries.push(`"k${i}":"v"`);
			}
			const result = await parseSafetensorsIndexStream(
				toStream(`{"metadata":{${entries.join(",")}},"weight_map":{"a":"s.safetensors"}}`),
			);
			expect(Object.keys(result.metadata ?? {})).toHaveLength(1_000);
			expect(result.shardFilenames).toEqual(["s.safetensors"]);
		});

		it("does not blow up on a weight_map of millions of entries pointing at few shards", async () => {
			// the legitimate-but-extreme case: bounded because we only keep distinct values
			const parts = ['{"weight_map":{'];
			for (let i = 0; i < 2_000_000; i++) {
				parts.push(`${i > 0 ? "," : ""}"t${i}":"s${i % 8}.safetensors"`);
			}
			parts.push("}}");
			const result = await parseSafetensorsIndexStream(toStream(parts.join("")), { maxBytes: Infinity });
			expect(result.weightMapEntryCount).toBe(2_000_000);
			expect(result.shardFilenames).toHaveLength(8);
			expect(result.weightMap).toBeUndefined();
		});

		it("stops downloading as soon as a limit trips", async () => {
			// the reader must be cancelled rather than drained: an endless body should not be pulled
			let chunksPulled = 0;
			const opener = new TextEncoder().encode('{"weight_map":');
			const chunk = new TextEncoder().encode("[".repeat(1024));
			const stream = new ReadableStream<Uint8Array>({
				pull(controller) {
					controller.enqueue(chunksPulled++ === 0 ? opener : chunk);
				},
			});

			await expect(parseSafetensorsIndexStream(stream)).rejects.toThrow(/nesting is deeper/);
			// the 64-deep limit trips within the first couple of chunks, not after millions
			expect(chunksPulled).toBeLessThan(10);
		});

		it("rejects an array at the root immediately", async () => {
			let chunksPulled = 0;
			const chunk = new TextEncoder().encode("[".repeat(1024));
			const stream = new ReadableStream<Uint8Array>({
				pull(controller) {
					chunksPulled++;
					controller.enqueue(chunk);
				},
			});

			await expect(parseSafetensorsIndexStream(stream)).rejects.toThrow(/must be a JSON object/);
			expect(chunksPulled).toBeLessThan(10);
		});
	});

	it("is chunk-boundary agnostic", async () => {
		const text = makeIndex(200, 7, { total_parameters: "42" });
		const reference = await parseSafetensorsIndexStream(toStream(text));

		for (const chunkSize of [1, 2, 17, 256, 4096]) {
			const result = await parseSafetensorsIndexStream(toStream(text, chunkSize));
			expect(result).toEqual(reference);
		}
	});

	it("handles unicode tensor names and filenames split across chunks", async () => {
		const text = JSON.stringify({
			metadata: { note: "héllo 🤗 中文" },
			weight_map: { "modèle.poids.🤗": "shard-é.safetensors" },
		});
		for (const chunkSize of [1, 3, 8]) {
			const result = await parseSafetensorsIndexStream(toStream(text, chunkSize));
			expect(result.metadata).toEqual({ note: "héllo 🤗 中文" });
			expect(result.shardFilenames).toEqual(["shard-é.safetensors"]);
		}
	});
});
