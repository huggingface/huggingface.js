import { expect, it, describe } from "vitest";
import { parseSafetensorsMetadata } from "./parse-safetensors-metadata";

/**
 * Unit tests for the fast sharded-header path introduced for issue #1979.
 * These use a stubbed `fetch` so they run offline and assert HTTP-level
 * behaviour (request count, Range headers, 206 enforcement).
 */
describe("parseSafetensorsMetadata (fast sharded path, mocked fetch)", () => {
	type Call = { url: string; method: string; range: string | null };

	function buildIndex(filenames: string[]): string {
		const weight_map: Record<string, string> = {};
		filenames.forEach((f, i) => {
			weight_map[`tensor_${i}`] = f;
		});
		return JSON.stringify({ weight_map });
	}

	function rangeOf(init: RequestInit | undefined): string | null {
		const h = init?.headers;
		if (!h) return null;
		if (h instanceof Headers) return h.get("Range");
		if (Array.isArray(h)) {
			const e = h.find(([k]) => k.toLowerCase() === "range");
			return e ? e[1] : null;
		}
		const r = (h as Record<string, string>)["Range"] ?? (h as Record<string, string>)["range"];
		return r ?? null;
	}

	function encodeHeader(header: Record<string, unknown>): { headerBytes: Uint8Array; lenBuf: ArrayBuffer } {
		const headerBytes = new TextEncoder().encode(JSON.stringify(header));
		const lenBuf = new ArrayBuffer(8);
		new DataView(lenBuf).setBigUint64(0, BigInt(headerBytes.byteLength), true);
		return { headerBytes, lenBuf };
	}

	/**
	 * Build a mock fetch that covers every request shape the sharded parser
	 * actually issues, plus a couple of test-only overrides.
	 *
	 * Request shapes handled:
	 *   - HEAD `/raw/<rev>/model.safetensors`            → 404 (forces sharded branch)
	 *   - HEAD `/raw/<rev>/model.safetensors.index.json` → 200
	 *   - GET  `/resolve/<rev>/model.safetensors.index.json`
	 *          Range bytes=0-0  → 206 with Content-Range header (file-download-info probe)
	 *          any other range  → 206 with the full index JSON body (WebBlob slice)
	 *   - GET  `/resolve/<rev>/model-XXXXX-of-YYYYY.safetensors`
	 *          Range bytes=0-7  → 206 8-byte little-endian header length
	 *          Range bytes=8-N  → 206 JSON header bytes
	 *
	 * Options:
	 *   refuse206 — first shard length probe returns 200 (simulates misbehaving CDN)
	 *   oversize  — first shard length probe encodes a 100 MB header length
	 */
	function buildMockFetch(
		calls: Call[],
		header: Record<string, unknown>,
		shards: string[],
		options: { refuse206?: boolean; oversize?: boolean } = {},
	): typeof fetch {
		const indexBody = buildIndex(shards);
		const { headerBytes, lenBuf } = encodeHeader(header);
		const totalShardSize = 8 + headerBytes.byteLength + 1024;

		return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
			const method = init?.method ?? "GET";
			const range = rangeOf(init);
			calls.push({ url, method, range });

			// fileExists uses HEAD against the `/raw/<rev>/<path>` endpoint.
			// Returning 404 for the single-file probe forces the entry logic
			// in parseSafetensorsMetadata to fall into the sharded-index branch.
			if (method === "HEAD") {
				if (url.endsWith("/model.safetensors.index.json")) {
					return new Response(null, { status: 200 });
				}
				return new Response(null, { status: 404 });
			}

			// GET on the index file — covers both the file-download-info
			// bytes=0-0 probe and the WebBlob body read.
			if (url.endsWith("/model.safetensors.index.json")) {
				if (range === "bytes=0-0") {
					return new Response("{", {
						status: 206,
						headers: {
							"Content-Range": `bytes 0-0/${indexBody.length}`,
							etag: '"index-etag"',
						},
					});
				}
				return new Response(indexBody, {
					status: 206,
					headers: {
						"Content-Range": `bytes 0-${indexBody.length - 1}/${indexBody.length}`,
						etag: '"index-etag"',
					},
				});
			}

			// GET on a shard file — the fast path under test.
			if (range === "bytes=0-7") {
				if (options.refuse206) {
					return new Response(new Uint8Array(1_000_000), { status: 200 });
				}
				if (options.oversize) {
					const buf = new ArrayBuffer(8);
					new DataView(buf).setBigUint64(0, BigInt(100 * 1024 * 1024), true);
					return new Response(buf, {
						status: 206,
						headers: { "Content-Range": "bytes 0-7/200000000" },
					});
				}
				return new Response(lenBuf, {
					status: 206,
					headers: { "Content-Range": `bytes 0-7/${totalShardSize}` },
				});
			}
			if (range?.startsWith("bytes=8-")) {
				return new Response(headerBytes, {
					status: 206,
					headers: {
						"Content-Range": `bytes 8-${7 + headerBytes.byteLength}/${totalShardSize}`,
					},
				});
			}

			throw new Error(`unexpected request: ${method} ${url} (Range=${range})`);
		}) as typeof fetch;
	}

	it("sharded path issues exactly 2 HTTP requests per shard (not 3)", async () => {
		const calls: Call[] = [];
		const shards = [
			"model-00001-of-00003.safetensors",
			"model-00002-of-00003.safetensors",
			"model-00003-of-00003.safetensors",
		];
		const header = {
			__metadata__: { format: "pt" },
			w: { dtype: "F32", shape: [10], data_offsets: [0, 40] },
		};

		const parse = await parseSafetensorsMetadata({
			repo: "fake-org/fake-model",
			path: "model.safetensors.index.json",
			revision: "main",
			fetch: buildMockFetch(calls, header, shards),
		});

		expect(parse.sharded).toBe(true);
		if (parse.sharded) {
			expect(Object.keys(parse.headers).length).toBe(3);
		}

		// Exactly two requests per shard — one length probe, one header body read.
		const shardCalls = calls.filter((c) => c.url.includes("/model-0000"));
		expect(shardCalls.length).toBe(2 * shards.length);

		const ranges = shardCalls.map((c) => c.range);
		expect(ranges.filter((r) => r === "bytes=0-7").length).toBe(shards.length);
		expect(ranges.filter((r) => r?.startsWith("bytes=8-")).length).toBe(shards.length);
	});

	it("rejects a shard response that returns 200 (server ignored Range)", async () => {
		const calls: Call[] = [];
		const shards = ["model-00001-of-00001.safetensors"];
		const header = { w: { dtype: "F32", shape: [4], data_offsets: [0, 16] } };

		await expect(
			parseSafetensorsMetadata({
				repo: "fake-org/fake-model",
				path: "model.safetensors.index.json",
				revision: "main",
				fetch: buildMockFetch(calls, header, shards, { refuse206: true }),
			}),
		).rejects.toThrow(/did not honor Range/);
	});

	it("rejects an oversized header length", async () => {
		const calls: Call[] = [];
		const shards = ["model-00001-of-00001.safetensors"];
		const header = { w: { dtype: "F32", shape: [4], data_offsets: [0, 16] } };

		await expect(
			parseSafetensorsMetadata({
				repo: "fake-org/fake-model",
				path: "model.safetensors.index.json",
				revision: "main",
				fetch: buildMockFetch(calls, header, shards, { oversize: true }),
			}),
		).rejects.toThrow(/header is too big/);
	});
});
