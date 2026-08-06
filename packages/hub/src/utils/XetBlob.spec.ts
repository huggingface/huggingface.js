import { describe, expect, it } from "vitest";
import type { ReconstructionInfo } from "./XetBlob";
import { bg4_regroup_bytes, bg4_split_bytes, XetBlob } from "./XetBlob";
import { combineUint8Arrays } from "./combineUint8Arrays";
import { sum } from "./sum";

describe("XetBlob", () => {
	it("should handle empty files (size 0) without making network requests", async () => {
		let fetchCount = 0;

		const blob = new XetBlob({
			hash: "test",
			size: 0,
			refreshUrl: "https://huggingface.co",
			fetch: async () => {
				fetchCount++;
				return new Response();
			},
		});

		const text = await blob.text();
		expect(text).toBe("");
		expect(fetchCount).toBe(0);

		const arrayBuffer = await blob.arrayBuffer();
		expect(arrayBuffer.byteLength).toBe(0);
		expect(fetchCount).toBe(0);

		const stream = blob.stream();
		const reader = stream.getReader();
		const result = await reader.read();
		expect(result.done).toBe(true);
		expect(result.value).toBeUndefined();
		expect(fetchCount).toBe(0);
	});

	it("should lazy load the first 22 bytes", async () => {
		const blob = new XetBlob({
			hash: "7b3b6d07673a88cf467e67c1f7edef1a8c268cbf66e9dd9b0366322d4ab56d9b",
			size: 5_234_139_343,
			refreshUrl: "https://huggingface.co/api/models/celinah/xet-experiments/xet-read-token/main",
		});

		expect(await blob.slice(10, 22).text()).toBe("__metadata__");
	});

	it("should load the first chunk correctly", async () => {
		let xorbCount = 0;
		const blob = new XetBlob({
			refreshUrl: "https://huggingface.co/api/models/celinah/xet-experiments/xet-read-token/main",
			hash: "7b3b6d07673a88cf467e67c1f7edef1a8c268cbf66e9dd9b0366322d4ab56d9b",
			size: 5_234_139_343,
			fetch: async (url, opts) => {
				if (typeof url === "string" && url.includes("/xorbs/")) {
					xorbCount++;
				}
				return fetch(url, opts);
			},
		});

		const xetDownload = await blob.slice(0, 29928).arrayBuffer();
		const bridgeDownload = await fetch(
			"https://huggingface.co/celinah/xet-experiments/resolve/main/model5GB.safetensors",
			{
				headers: {
					Range: "bytes=0-29927",
				},
			},
		).then((res) => res.arrayBuffer());

		expect(new Uint8Array(xetDownload)).toEqual(new Uint8Array(bridgeDownload));
		expect(xorbCount).toBe(1);
	});

	it("should load just past the first chunk correctly", async () => {
		let xorbCount = 0;
		const blob = new XetBlob({
			refreshUrl: "https://huggingface.co/api/models/celinah/xet-experiments/xet-read-token/main",
			hash: "7b3b6d07673a88cf467e67c1f7edef1a8c268cbf66e9dd9b0366322d4ab56d9b",
			size: 5_234_139_343,
			fetch: async (url, opts) => {
				if (typeof url === "string" && url.includes("/xorbs/")) {
					xorbCount++;
				}
				return fetch(url, opts);
			},
		});

		const xetDownload = await blob.slice(0, 29929).arrayBuffer();
		const bridgeDownload = await fetch(
			"https://huggingface.co/celinah/xet-experiments/resolve/main/model5GB.safetensors",
			{
				headers: {
					Range: "bytes=0-29928",
				},
			},
		).then((res) => res.arrayBuffer());

		expect(xetDownload.byteLength).toBe(29929);
		expect(new Uint8Array(xetDownload)).toEqual(new Uint8Array(bridgeDownload));
		expect(xorbCount).toBe(2);
	});

	it("should load the first 200kB correctly", async () => {
		let xorbCount = 0;
		const blob = new XetBlob({
			refreshUrl: "https://huggingface.co/api/models/celinah/xet-experiments/xet-read-token/main",
			hash: "7b3b6d07673a88cf467e67c1f7edef1a8c268cbf66e9dd9b0366322d4ab56d9b",
			size: 5_234_139_343,
			fetch: async (url, opts) => {
				if (typeof url === "string" && url.includes("/xorbs/")) {
					xorbCount++;
				}
				return fetch(url, opts);
			},
			// internalLogging: true,
		});

		const xetDownload = await blob.slice(0, 200_000).arrayBuffer();
		const bridgeDownload = await fetch(
			"https://huggingface.co/celinah/xet-experiments/resolve/main/model5GB.safetensors",
			{
				headers: {
					Range: "bytes=0-199999",
				},
			},
		).then((res) => res.arrayBuffer());

		expect(xetDownload.byteLength).toBe(200_000);
		expect(new Uint8Array(xetDownload)).toEqual(new Uint8Array(bridgeDownload));
		expect(xorbCount).toBe(2);
	}, 60_000);

	it("should load correctly when loading far into a chunk range", async () => {
		const blob = new XetBlob({
			refreshUrl: "https://huggingface.co/api/models/celinah/xet-experiments/xet-read-token/main",
			hash: "7b3b6d07673a88cf467e67c1f7edef1a8c268cbf66e9dd9b0366322d4ab56d9b",
			size: 5_234_139_343,
			// internalLogging: true,
		});

		const xetDownload = await blob.slice(10_000_000, 10_100_000).arrayBuffer();
		const bridgeDownload = await fetch(
			"https://huggingface.co/celinah/xet-experiments/resolve/main/model5GB.safetensors",
			{
				headers: {
					Range: "bytes=10000000-10099999",
				},
			},
		).then((res) => res.arrayBuffer());

		console.log("xet", xetDownload.byteLength, "bridge", bridgeDownload.byteLength);
		expect(new Uint8Array(xetDownload).length).toEqual(100_000);
		expect(new Uint8Array(xetDownload)).toEqual(new Uint8Array(bridgeDownload));
	});

	it("should load text correctly when offset_into_range starts in a chunk further than the first", async () => {
		const blob = new XetBlob({
			refreshUrl: "https://huggingface.co/api/models/celinah/xet-experiments/xet-read-token/main",
			hash: "794efea76d8cb372bbe1385d9e51c3384555f3281e629903ecb6abeff7d54eec",
			size: 62_914_580,
		});

		// Reconstruction info
		// {
		// 	"offset_into_first_range": 600000,
		// 	"terms":
		// 		[
		// 			{
		// 				"hash": "be748f77930d5929cabd510a15f2c30f2f460b639804ef79dea46affa04fd8b2",
		// 				"unpacked_length": 655360,
		// 				"range": { "start": 0, "end": 5 },
		// 			},
		// 			{
		// 				"hash": "be748f77930d5929cabd510a15f2c30f2f460b639804ef79dea46affa04fd8b2",
		// 				"unpacked_length": 655360,
		// 				"range": { "start": 0, "end": 5 },
		// 			},
		// 		],
		// 	"xorbs":
		// 		{
		// 			"be748f77930d5929cabd510a15f2c30f2f460b639804ef79dea46affa04fd8b2":
		// 				[
		// 					{
		// 						"url": "...",
		// 						"ranges": [{ "chunks": { "start": 0, "end": 5 }, "bytes": { "start": 0, "end": 2839 } }],
		// 					},
		// 				],
		// 		},
		// }

		const text = await blob.slice(600_000, 700_000).text();
		const bridgeDownload = await fetch("https://huggingface.co/celinah/xet-experiments/resolve/main/large_text.txt", {
			headers: {
				Range: "bytes=600000-699999",
			},
		}).then((res) => res.text());

		console.log("xet", text.length, "bridge", bridgeDownload.length);
		expect(text.length).toBe(bridgeDownload.length);
	});

	describe("parallelDownloads", () => {
		// Build a file spread over `xorbCount` distinct xorbs (2 chunks each), served by one URL per
		// xorb so the entry fetches are independent and can overlap.
		function makeParallelFixture(xorbCount: number) {
			const contents = Array(xorbCount)
				.fill(0)
				.map((_, i) => [`chunk-${i}-a-`, `chunk-${i}-b!`] as const);
			const xorbData = contents.map(([a, b]) => combineUint8Arrays(makeChunk(a), makeChunk(b)));
			const wholeText = contents.map(([a, b]) => a + b).join("");

			const reconstructionInfo: ReconstructionInfo = {
				terms: contents.map(([a, b], i) => ({
					hash: `xorb${i}`,
					range: { start: 0, end: 2 },
					unpacked_length: a.length + b.length,
				})),
				xorbs: Object.fromEntries(
					contents.map(([, ,], i) => [
						`xorb${i}`,
						[
							{
								url: `https://xorb.co/${i}`,
								ranges: [{ chunks: { start: 0, end: 2 }, bytes: { start: 0, end: xorbData[i].byteLength - 1 } }],
							},
						],
					]),
				),
				offset_into_first_range: 0,
			};

			return { wholeText, xorbData, reconstructionInfo };
		}

		function makeFetch(
			fixture: ReturnType<typeof makeParallelFixture>,
			opts?: { gate?: Promise<void>; onXorbRequest?: (i: number) => void; failIndex?: number },
		): typeof fetch {
			return async function (_url) {
				const url = new URL(_url as string);
				switch (url.hostname) {
					case "huggingface.co":
						return new Response(JSON.stringify({ casUrl: "https://cas.co", accessToken: "boo", exp: 1_000_000 }));
					case "cas.co":
						return new Response(JSON.stringify(fixture.reconstructionInfo));
					case "xorb.co": {
						const i = Number(url.pathname.slice(1));
						opts?.onXorbRequest?.(i);
						if (opts?.failIndex === i) {
							return new Response("boom", { status: 500 });
						}
						await opts?.gate;
						return new Response(fixture.xorbData[i]);
					}
					default:
						throw new Error(`Unhandled URL ${url.hostname}`);
				}
			};
		}

		it("downloads a multi-xorb file in parallel and in order", async () => {
			const fixture = makeParallelFixture(6);

			let inFlight = 0;
			let maxInFlight = 0;
			let release!: () => void;
			const released = new Promise<void>((resolve) => (release = resolve));

			let stat: Record<string, unknown> | undefined;
			const blob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				parallelDownloads: { maxConcurrency: 4, onStat: (s) => (stat = s) },
				fetch: makeFetch(fixture, {
					gate: released,
					onXorbRequest: () => {
						inFlight++;
						maxInFlight = Math.max(maxInFlight, inFlight);
					},
				}),
			});

			const read = blob.text();
			// Let the scheduler ramp its look-ahead, then release the gated responses.
			await new Promise((resolve) => setTimeout(resolve, 20));
			release();

			expect(await read).toBe(fixture.wholeText);
			expect(maxInFlight).toBeGreaterThan(1);
			expect(stat?.entries).toBe(6);
		});

		it("keeps a single request in flight when the budget only fits one entry", async () => {
			const fixture = makeParallelFixture(4);

			let stat: Record<string, unknown> | undefined;
			const blob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				// Budget smaller than a single entry: only the currently-needed entry may proceed.
				parallelDownloads: { maxConcurrency: 4, maxInFlightBytes: 1, onStat: (s) => (stat = s) },
				fetch: makeFetch(fixture),
			});

			expect(await blob.text()).toBe(fixture.wholeText);
			expect(stat?.maxActive).toBe(1);
		});

		it("propagates fetch errors", async () => {
			const fixture = makeParallelFixture(3);

			const blob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				parallelDownloads: true,
				fetch: makeFetch(fixture, { failIndex: 1 }),
			});

			await expect(blob.text()).rejects.toThrow();
		});

		it("handles slices with an offset into the first term", async () => {
			const fixture = makeParallelFixture(4);

			const serialBlob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				fetch: makeFetch(fixture),
			});
			const parallelBlob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				parallelDownloads: true,
				fetch: makeFetch(fixture),
			});

			for (const [start, end] of [
				[0, fixture.wholeText.length],
				[5, 30],
				[13, fixture.wholeText.length - 3],
			]) {
				expect(await parallelBlob.slice(start, end).text(), `slice ${start}-${end}`).toBe(
					await serialBlob.slice(start, end).text(),
				);
			}
		});

		it("refreshes the reconstruction info when a signed URL expired", async () => {
			const fixture = makeParallelFixture(3);
			let expired = true;

			const blob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				parallelDownloads: true,
				fetch: async function (_url, opts) {
					const url = new URL(_url as string);
					if (url.hostname === "xorb.co" && expired) {
						expired = false;
						return new Response(null, { status: 403 });
					}
					return makeFetch(fixture)(_url as string, opts);
				},
			});

			expect(await blob.text()).toBe(fixture.wholeText);
		});
	});

	describe("multi-range fetch entries", () => {
		function makeMultipartResponse(
			boundary: string,
			parts: Array<{ range: { start: number; end: number }; total: number; data: Uint8Array }>,
		): Response {
			const enc = new TextEncoder();
			const segments: Uint8Array[] = [];
			for (const part of parts) {
				segments.push(
					enc.encode(
						`\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n` +
							`Content-Range: bytes ${part.range.start}-${part.range.end}/${part.total}\r\n\r\n`,
					),
					part.data,
				);
			}
			segments.push(enc.encode(`\r\n--${boundary}--\r\n`));

			return new Response(combineUint8Arrays(...segments), {
				headers: { "Content-Type": `multipart/byteranges; boundary=${boundary}` },
			});
		}

		interface XorbFixture {
			wholeText: string;
			total: number;
			lenA: number;
			rangeAData: Uint8Array;
			rangeBData: Uint8Array;
			reconstructionInfo: ReconstructionInfo;
		}

		/** A xorb with two signed ranges: chunks [0,2) = "helloworld" and chunks [4,6) = "foobar!" */
		function makeFixture(): XorbFixture {
			const rangeAData = combineUint8Arrays(makeChunk("hello"), makeChunk("world"));
			const rangeBData = combineUint8Arrays(makeChunk("foo"), makeChunk("bar!"));
			const lenA = rangeAData.byteLength;
			const total = lenA + rangeBData.byteLength;

			return {
				wholeText: "helloworldfoobar!",
				total,
				lenA,
				rangeAData,
				rangeBData,
				reconstructionInfo: {
					terms: [
						{ hash: "xorb1", range: { start: 0, end: 2 }, unpacked_length: 10 },
						{ hash: "xorb1", range: { start: 4, end: 6 }, unpacked_length: 7 },
					],
					xorbs: {
						xorb1: [
							{
								url: "https://xorb.co",
								ranges: [
									{ chunks: { start: 0, end: 2 }, bytes: { start: 0, end: lenA - 1 } },
									{ chunks: { start: 4, end: 6 }, bytes: { start: lenA, end: total - 1 } },
								],
							},
						],
					},
					offset_into_first_range: 0,
				},
			};
		}

		it("fetches a multi-range xorb in one multipart/byteranges request", async () => {
			const fixture = makeFixture();

			let fetchCount = 0;
			let multiRangeHeader: string | undefined;

			const blob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				fetch: async function (_url, opts) {
					const url = new URL(_url as string);
					const headers = opts?.headers as Record<string, string> | undefined;

					switch (url.hostname) {
						case "huggingface.co":
							return new Response(JSON.stringify({ casUrl: "https://cas.co", accessToken: "boo", exp: 1_000_000 }));
						case "cas.co": {
							expect(url.pathname).toContain("/v2/reconstructions/");
							return new Response(JSON.stringify(fixture.reconstructionInfo));
						}
						case "xorb.co": {
							fetchCount++;
							multiRangeHeader = headers?.["Range"];
							return makeMultipartResponse("BOUNDARY", [
								{ range: { start: 0, end: fixture.lenA - 1 }, total: fixture.total, data: fixture.rangeAData },
								{
									range: { start: fixture.lenA, end: fixture.total - 1 },
									total: fixture.total,
									data: fixture.rangeBData,
								},
							]);
						}
						default:
							throw new Error(`Unhandled URL ${url.hostname}`);
					}
				},
			});

			expect(await blob.text()).toBe(fixture.wholeText);
			// Both ranges of the xorb are fetched together in a single multi-range request.
			expect(fetchCount).toBe(1);
			expect(multiRangeHeader).toBe(`bytes=0-${fixture.lenA - 1},${fixture.lenA}-${fixture.total - 1}`);
		});

		it("throws when the server doesn't answer a multi-range request with multipart/byteranges", async () => {
			const fixture = makeFixture();

			const blob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				fetch: async function (_url, opts) {
					const url = new URL(_url as string);
					const headers = opts?.headers as Record<string, string> | undefined;

					switch (url.hostname) {
						case "huggingface.co":
							return new Response(JSON.stringify({ casUrl: "https://cas.co", accessToken: "boo", exp: 1_000_000 }));
						case "cas.co":
							return new Response(JSON.stringify(fixture.reconstructionInfo));
						case "xorb.co":
							// The server ignored the multi-range request and returned the whole xorb.
							expect(headers?.["Range"]).toBe(`bytes=0-${fixture.lenA - 1},${fixture.lenA}-${fixture.total - 1}`);
							return new Response(combineUint8Arrays(fixture.rangeAData, fixture.rangeBData));
						default:
							throw new Error(`Unhandled URL ${url.hostname}`);
					}
				},
			});

			await expect(blob.text()).rejects.toThrow(/multipart\/byteranges/);
		});

		it("throws when a multipart part is missing", async () => {
			const fixture = makeFixture();

			const blob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				fetch: async function (_url) {
					const url = new URL(_url as string);

					switch (url.hostname) {
						case "huggingface.co":
							return new Response(JSON.stringify({ casUrl: "https://cas.co", accessToken: "boo", exp: 1_000_000 }));
						case "cas.co":
							return new Response(JSON.stringify(fixture.reconstructionInfo));
						case "xorb.co":
							// Multipart response missing the second requested part.
							return makeMultipartResponse("BOUNDARY", [
								{ range: { start: 0, end: fixture.lenA - 1 }, total: fixture.total, data: fixture.rangeAData },
							]);
						default:
							throw new Error(`Unhandled URL ${url.hostname}`);
					}
				},
			});

			await expect(blob.text()).rejects.toThrow(/produced 1 parts but expected 2/);
		});

		it("handles a single-range fetch entry without multipart", async () => {
			const xorbData = combineUint8Arrays(makeChunk("hello"), makeChunk("world"));
			const wholeText = "helloworld";

			let fetchCount = 0;

			const blob = new XetBlob({
				hash: "test",
				size: wholeText.length,
				refreshUrl: "https://huggingface.co",
				fetch: async function (_url) {
					const url = new URL(_url as string);

					switch (url.hostname) {
						case "huggingface.co":
							return new Response(JSON.stringify({ casUrl: "https://cas.co", accessToken: "boo", exp: 1_000_000 }));
						case "cas.co":
							return new Response(
								JSON.stringify({
									terms: [{ hash: "xorb1", range: { start: 0, end: 2 }, unpacked_length: 10 }],
									xorbs: {
										xorb1: [
											{
												url: "https://xorb.co",
												ranges: [{ chunks: { start: 0, end: 2 }, bytes: { start: 0, end: xorbData.byteLength - 1 } }],
											},
										],
									},
									offset_into_first_range: 0,
								} satisfies ReconstructionInfo),
							);
						case "xorb.co":
							fetchCount++;
							return new Response(xorbData);
						default:
							throw new Error(`Unhandled URL ${url.hostname}`);
					}
				},
			});

			expect(await blob.text()).toBe(wholeText);
			expect(fetchCount).toBe(1);
		});

		it("throws when a multipart part decodes to fewer chunks than expected", async () => {
			const fixture = makeFixture();

			const blob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				fetch: async function (_url) {
					const url = new URL(_url as string);

					switch (url.hostname) {
						case "huggingface.co":
							return new Response(JSON.stringify({ casUrl: "https://cas.co", accessToken: "boo", exp: 1_000_000 }));
						case "cas.co":
							return new Response(JSON.stringify(fixture.reconstructionInfo));
						case "xorb.co":
							// Second part is truncated: only one of its two chunks.
							return makeMultipartResponse("BOUNDARY", [
								{ range: { start: 0, end: fixture.lenA - 1 }, total: fixture.total, data: fixture.rangeAData },
								{
									range: { start: fixture.lenA, end: fixture.total - 1 },
									total: fixture.total,
									data: makeChunk("foo"),
								},
							]);
						default:
							throw new Error(`Unhandled URL ${url.hostname}`);
					}
				},
			});

			await expect(blob.text()).rejects.toThrow(/expected/);
		});

		it("throws when the decoded term data doesn't match unpacked_length", async () => {
			const fixture = makeFixture();
			// Corrupt the expected length of the second term
			fixture.reconstructionInfo.terms[1].unpacked_length = 9999;

			const blob = new XetBlob({
				hash: "test",
				size: fixture.wholeText.length,
				refreshUrl: "https://huggingface.co",
				fetch: async function (_url) {
					const url = new URL(_url as string);

					switch (url.hostname) {
						case "huggingface.co":
							return new Response(JSON.stringify({ casUrl: "https://cas.co", accessToken: "boo", exp: 1_000_000 }));
						case "cas.co":
							return new Response(JSON.stringify(fixture.reconstructionInfo));
						case "xorb.co":
							return makeMultipartResponse("BOUNDARY", [
								{ range: { start: 0, end: fixture.lenA - 1 }, total: fixture.total, data: fixture.rangeAData },
								{
									range: { start: fixture.lenA, end: fixture.total - 1 },
									total: fixture.total,
									data: fixture.rangeBData,
								},
							]);
						default:
							throw new Error(`Unhandled URL ${url.hostname}`);
					}
				},
			});

			await expect(blob.text()).rejects.toThrow(/expected 9999/);
		});
	});

	describe("bg4_regoup_bytes", () => {
		it("should regroup bytes when the array is %4 length", () => {
			expect(bg4_regroup_bytes(new Uint8Array([1, 5, 2, 6, 3, 7, 4, 8]))).toEqual(
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
			);
		});

		it("should regroup bytes when the array is %4 + 1 length", () => {
			expect(bg4_regroup_bytes(new Uint8Array([1, 5, 9, 2, 6, 3, 7, 4, 8]))).toEqual(
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
			);
		});

		it("should regroup bytes when the array is %4 + 2 length", () => {
			expect(bg4_regroup_bytes(new Uint8Array([1, 5, 9, 2, 6, 10, 3, 7, 4, 8]))).toEqual(
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
			);
		});

		it("should regroup bytes when the array is %4 + 3 length", () => {
			expect(bg4_regroup_bytes(new Uint8Array([1, 5, 9, 2, 6, 10, 3, 7, 11, 4, 8]))).toEqual(
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
			);
		});
	});

	describe("bg4_split_bytes", () => {
		it("should split bytes when the array is %4 length", () => {
			expect(bg4_split_bytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toEqual(
				new Uint8Array([1, 5, 2, 6, 3, 7, 4, 8]),
			);
		});

		it("should split bytes when the array is %4 + 1 length", () => {
			expect(bg4_split_bytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]))).toEqual(
				new Uint8Array([1, 5, 9, 2, 6, 3, 7, 4, 8]),
			);
		});

		it("should split bytes when the array is %4 + 2 length", () => {
			expect(bg4_split_bytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))).toEqual(
				new Uint8Array([1, 5, 9, 2, 6, 10, 3, 7, 4, 8]),
			);
		});

		it("should split bytes when the array is %4 + 3 length", () => {
			expect(bg4_split_bytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]))).toEqual(
				new Uint8Array([1, 5, 9, 2, 6, 10, 3, 7, 11, 4, 8]),
			);
		});

		it("should be the inverse of bg4_regroup_bytes", () => {
			const testArrays = [
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
				new Uint8Array([42]),
				new Uint8Array([1, 2]),
				new Uint8Array([1, 2, 3]),
			];

			testArrays.forEach((arr) => {
				expect(bg4_regroup_bytes(bg4_split_bytes(arr))).toEqual(arr);
			});
		});
	});

	describe("when mocked", () => {
		describe("loading many chunks every read", () => {
			it("should load different slices", async () => {
				const chunk1Content = "hello";
				const chunk2Content = "world!";
				const debugged: Array<{ event: "read" | string } & Record<string, unknown>> = [];

				const chunks = Array(1000)
					.fill(0)
					.flatMap(() => [makeChunk(chunk1Content), makeChunk(chunk2Content)]);

				const mergedChunks = await new Blob(chunks).arrayBuffer();
				const wholeText = (chunk1Content + chunk2Content).repeat(1000);

				const totalSize = wholeText.length;
				let fetchCount = 0;

				const blob = new XetBlob({
					hash: "test",
					size: totalSize,
					refreshUrl: "https://huggingface.co",
					listener: (e) => debugged.push(e),
					fetch: async function (_url, opts) {
						const url = new URL(_url as string);
						const headers = opts?.headers as Record<string, string> | undefined;

						switch (url.hostname) {
							case "huggingface.co": {
								// This is a token
								return new Response(
									JSON.stringify({
										casUrl: "https://cas.co",
										accessToken: "boo",
										exp: 1_000_000,
									}),
								);
							}
							case "cas.co": {
								// This is the reconstruction info
								const range = headers?.["Range"]?.slice("bytes=".length).split("-").map(Number);

								const start = range?.[0] ?? 0;
								// const end = range?.[1] ?? (totalSize - 1);

								return new Response(
									JSON.stringify({
										terms: Array(1000)
											.fill(0)
											.map(() => ({
												hash: "test",
												range: {
													start: 0,
													end: 2,
												},
												unpacked_length: chunk1Content.length + chunk2Content.length,
											})),
										xorbs: {
											test: [
												{
													url: "https://fetch.co",
													ranges: [
														{
															chunks: { start: 0, end: 2 },
															bytes: { start: 0, end: mergedChunks.byteLength / 1000 - 1 },
														},
													],
												},
											],
										},
										offset_into_first_range: start,
									} satisfies ReconstructionInfo),
								);
							}
							case "fetch.co": {
								fetchCount++;
								return new Response(
									new ReadableStream({
										pull(controller) {
											controller.enqueue(new Uint8Array(mergedChunks));
											controller.close();
										},
									}),
									//mergedChunks
								);
							}
							default:
								throw new Error("Unhandled URL");
						}
					},
				});

				const startIndexes = [0, 5, 11, 6, 12, 100, 2000, totalSize - 12, totalSize - 2];

				for (const index of startIndexes) {
					console.log("slice", index);
					const content = await blob.slice(index).text();
					expect(content.length).toBe(wholeText.length - index);
					expect(content.slice(0, 1000)).toEqual(wholeText.slice(index).slice(0, 1000));
					expect(debugged.filter((e) => e.event === "read").length).toBe(2); // 1 read + 1 undefined
					expect(fetchCount).toEqual(1);

					fetchCount = 0;
					debugged.length = 0;
				}
			});

			it("should load different slices when working with different XORBS", async () => {
				const chunk1Content = "hello";
				const chunk2Content = "world!";
				const debugged: Array<{ event: "read" | string } & Record<string, unknown>> = [];

				const chunks = Array(1000)
					.fill(0)
					.flatMap(() => [makeChunk(chunk1Content), makeChunk(chunk2Content)]);

				const mergedChunks = await new Blob(chunks).arrayBuffer();
				const wholeText = (chunk1Content + chunk2Content).repeat(1000);

				const totalSize = wholeText.length;
				let fetchCount = 0;

				const blob = new XetBlob({
					hash: "test",
					size: totalSize,
					refreshUrl: "https://huggingface.co",
					listener: (e) => debugged.push(e),
					fetch: async function (_url, opts) {
						const url = new URL(_url as string);
						const headers = opts?.headers as Record<string, string> | undefined;

						switch (url.hostname) {
							case "huggingface.co": {
								// This is a token
								return new Response(
									JSON.stringify({
										casUrl: "https://cas.co",
										accessToken: "boo",
										exp: 1_000_000,
									}),
								);
							}
							case "cas.co": {
								// This is the reconstruction info
								const range = headers?.["Range"]?.slice("bytes=".length).split("-").map(Number);

								const start = range?.[0] ?? 0;
								// const end = range?.[1] ?? (totalSize - 1);

								return new Response(
									JSON.stringify({
										terms: Array(1000)
											.fill(0)
											.map((_, i) => ({
												hash: "test" + (i % 2),
												range: {
													start: 0,
													end: 2,
												},
												unpacked_length: chunk1Content.length + chunk2Content.length,
											})),
										xorbs: {
											test0: [
												{
													url: "https://fetch.co",
													ranges: [
														{
															chunks: { start: 0, end: 2 },
															bytes: { start: 0, end: mergedChunks.byteLength - 1 },
														},
													],
												},
											],
											test1: [
												{
													url: "https://fetch.co",
													ranges: [
														{
															chunks: { start: 0, end: 2 },
															bytes: { start: 0, end: mergedChunks.byteLength - 1 },
														},
													],
												},
											],
										},
										offset_into_first_range: start,
									} satisfies ReconstructionInfo),
								);
							}
							case "fetch.co": {
								fetchCount++;
								return new Response(
									new ReadableStream({
										pull(controller) {
											controller.enqueue(new Uint8Array(mergedChunks));
											controller.close();
										},
									}),
									//mergedChunks
								);
							}
							default:
								throw new Error("Unhandled URL");
						}
					},
				});

				const startIndexes = [0, 5, 11, 6, 12, 100, 2000, totalSize - 12, totalSize - 2];

				for (const index of startIndexes) {
					console.log("slice", index);
					const content = await blob.slice(index).text();
					expect(content.length).toBe(wholeText.length - index);
					expect(content.slice(0, 1000)).toEqual(wholeText.slice(index).slice(0, 1000));
					expect(debugged.filter((e) => e.event === "read").length).toBe(4); // 1 read + 1 undefined
					expect(fetchCount).toEqual(2);

					fetchCount = 0;
					debugged.length = 0;
				}
			});
		});

		describe("loading one chunk at a time", () => {
			it("should load different slices but not till the end", async () => {
				const chunk1Content = "hello";
				const chunk2Content = "world!";
				const debugged: Array<{ event: "read" | string } & Record<string, unknown>> = [];

				const chunks = Array(1000)
					.fill(0)
					.flatMap(() => [makeChunk(chunk1Content), makeChunk(chunk2Content)]);

				const totalChunkLength = sum(chunks.map((x) => x.byteLength));
				const wholeText = (chunk1Content + chunk2Content).repeat(1000);

				const totalSize = wholeText.length;
				let fetchCount = 0;

				const blob = new XetBlob({
					hash: "test",
					size: totalSize,
					refreshUrl: "https://huggingface.co",
					listener: (e) => debugged.push(e),
					fetch: async function (_url, opts) {
						const url = new URL(_url as string);
						const headers = opts?.headers as Record<string, string> | undefined;

						switch (url.hostname) {
							case "huggingface.co": {
								// This is a token
								return new Response(
									JSON.stringify({
										casUrl: "https://cas.co",
										accessToken: "boo",
										exp: 1_000_000,
									}),
								);
							}
							case "cas.co": {
								// This is the reconstruction info
								const range = headers?.["Range"]?.slice("bytes=".length).split("-").map(Number);

								const start = range?.[0] ?? 0;
								// const end = range?.[1] ?? (totalSize - 1);

								return new Response(
									JSON.stringify({
										terms: [
											{
												hash: "test",
												range: {
													start: 0,
													end: 2000,
												},
												unpacked_length: chunk1Content.length + chunk2Content.length,
											},
										],
										xorbs: {
											test: [
												{
													url: "https://fetch.co",
													ranges: [
														{
															chunks: { start: 0, end: 2000 },
															bytes: { start: 0, end: totalChunkLength - 1 },
														},
													],
												},
											],
										},
										offset_into_first_range: start,
									} satisfies ReconstructionInfo),
								);
							}
							case "fetch.co": {
								fetchCount++;
								return new Response(
									new ReadableStream({
										pull(controller) {
											for (const chunk of chunks) {
												controller.enqueue(chunk);
											}
											controller.close();
										},
									}),
									{
										headers: {
											"Content-Range": `bytes 0-${totalChunkLength - 1}/${totalChunkLength}`,
											ETag: `"test"`,
											"Content-Length": `${totalChunkLength}`,
										},
									},
								);
							}
							default:
								throw new Error("Unhandled URL");
						}
					},
				});

				const startIndexes = [0, 5, 11, 6, 12, 100, 2000];

				for (const index of startIndexes) {
					console.log("slice", index);
					const content = await blob.slice(index, 4000).text();
					expect(content.length).toBe(4000 - index);
					expect(content.slice(0, 1000)).toEqual(wholeText.slice(index).slice(0, 1000));
					expect(fetchCount).toEqual(1);

					fetchCount = 0;
					debugged.length = 0;
				}
			});

			it("should load different slices", async () => {
				const chunk1Content = "hello";
				const chunk2Content = "world!";
				const debugged: Array<{ event: "read" | string } & Record<string, unknown>> = [];

				const chunks = Array(1000)
					.fill(0)
					.flatMap(() => [makeChunk(chunk1Content), makeChunk(chunk2Content)]);

				const totalChunkLength = sum(chunks.map((x) => x.byteLength));
				const wholeText = (chunk1Content + chunk2Content).repeat(1000);

				const totalSize = wholeText.length;
				let fetchCount = 0;

				const blob = new XetBlob({
					hash: "test",
					size: totalSize,
					refreshUrl: "https://huggingface.co",
					listener: (e) => debugged.push(e),
					fetch: async function (_url, opts) {
						const url = new URL(_url as string);
						const headers = opts?.headers as Record<string, string> | undefined;

						switch (url.hostname) {
							case "huggingface.co": {
								// This is a token
								return new Response(
									JSON.stringify({
										casUrl: "https://cas.co",
										accessToken: "boo",
										exp: 1_000_000,
									}),
								);
							}
							case "cas.co": {
								// This is the reconstruction info
								const range = headers?.["Range"]?.slice("bytes=".length).split("-").map(Number);

								const start = range?.[0] ?? 0;
								// const end = range?.[1] ?? (totalSize - 1);

								return new Response(
									JSON.stringify({
										terms: Array(1000)
											.fill(0)
											.map(() => ({
												hash: "test",
												range: {
													start: 0,
													end: 2,
												},
												unpacked_length: chunk1Content.length + chunk2Content.length,
											})),
										xorbs: {
											test: [
												{
													url: "https://fetch.co",
													ranges: [
														{
															chunks: { start: 0, end: 2 },
															bytes: { start: 0, end: totalChunkLength - 1 },
														},
													],
												},
											],
										},
										offset_into_first_range: start,
									} satisfies ReconstructionInfo),
								);
							}
							case "fetch.co": {
								fetchCount++;
								return new Response(
									new ReadableStream({
										pull(controller) {
											for (const chunk of chunks) {
												controller.enqueue(chunk);
											}
											controller.close();
										},
									}),
								);
							}
							default:
								throw new Error("Unhandled URL");
						}
					},
				});

				const startIndexes = [0, 5, 11, 6, 12, 100, 2000, totalSize - 12, totalSize - 2];

				for (const index of startIndexes) {
					console.log("slice", index);
					const content = await blob.slice(index).text();
					expect(content.length).toBe(wholeText.length - index);
					expect(content.slice(0, 1000)).toEqual(wholeText.slice(index).slice(0, 1000));
					expect(debugged.filter((e) => e.event === "read").length).toBe(2000 + 1); // 1 read for each chunk + 1 undefined
					expect(fetchCount).toEqual(1);

					fetchCount = 0;
					debugged.length = 0;
				}
			});
		});

		describe("loading at 29 bytes intervals", () => {
			it("should load different slices", async () => {
				const chunk1Content = "hello";
				const chunk2Content = "world!";
				const debugged: Array<{ event: "read" | string } & Record<string, unknown>> = [];

				const chunks = Array(1000)
					.fill(0)
					.flatMap(() => [makeChunk(chunk1Content), makeChunk(chunk2Content)]);
				const mergedChunks = await new Blob(chunks).arrayBuffer();
				const splitChunks = splitChunk(new Uint8Array(mergedChunks), 29);

				const totalChunkLength = sum(chunks.map((x) => x.byteLength));
				const wholeText = (chunk1Content + chunk2Content).repeat(1000);

				const totalSize = wholeText.length;
				let fetchCount = 0;

				const blob = new XetBlob({
					hash: "test",
					size: totalSize,
					refreshUrl: "https://huggingface.co",
					listener: (e) => debugged.push(e),
					fetch: async function (_url, opts) {
						const url = new URL(_url as string);
						const headers = opts?.headers as Record<string, string> | undefined;

						switch (url.hostname) {
							case "huggingface.co": {
								// This is a token
								return new Response(
									JSON.stringify({
										casUrl: "https://cas.co",
										accessToken: "boo",
										exp: 1_000_000,
									}),
								);
							}
							case "cas.co": {
								// This is the reconstruction info
								const range = headers?.["Range"]?.slice("bytes=".length).split("-").map(Number);

								const start = range?.[0] ?? 0;
								// const end = range?.[1] ?? (totalSize - 1);

								return new Response(
									JSON.stringify({
										terms: Array(1000)
											.fill(0)
											.map(() => ({
												hash: "test",
												range: {
													start: 0,
													end: 2,
												},
												unpacked_length: chunk1Content.length + chunk2Content.length,
											})),
										xorbs: {
											test: [
												{
													url: "https://fetch.co",
													ranges: [
														{
															chunks: { start: 0, end: 2 },
															bytes: { start: 0, end: totalChunkLength - 1 },
														},
													],
												},
											],
										},
										offset_into_first_range: start,
									} satisfies ReconstructionInfo),
								);
							}
							case "fetch.co": {
								fetchCount++;
								return new Response(
									new ReadableStream({
										pull(controller) {
											for (const chunk of splitChunks) {
												controller.enqueue(chunk);
											}
											controller.close();
										},
									}),
								);
							}
							default:
								throw new Error("Unhandled URL");
						}
					},
				});

				const startIndexes = [0, 5, 11, 6, 12, 100, 2000, totalSize - 12, totalSize - 2];

				for (const index of startIndexes) {
					console.log("slice", index);
					const content = await blob.slice(index).text();
					expect(content.length).toBe(wholeText.length - index);
					expect(content.slice(0, 1000)).toEqual(wholeText.slice(index).slice(0, 1000));
					expect(debugged.filter((e) => e.event === "read").length).toBe(Math.ceil(totalChunkLength / 29) + 1); // 1 read for each chunk + 1 undefined
					expect(fetchCount).toEqual(1);

					fetchCount = 0;
					debugged.length = 0;
				}
			});
		});

		describe("loading one byte at a time", () => {
			it("should load different slices", async () => {
				const chunk1Content = "hello";
				const chunk2Content = "world!";
				const debugged: Array<{ event: "read" | string } & Record<string, unknown>> = [];

				const chunks = Array(100)
					.fill(0)
					.flatMap(() => [makeChunk(chunk1Content), makeChunk(chunk2Content)])
					.flatMap((x) => splitChunk(x, 1));

				const totalChunkLength = sum(chunks.map((x) => x.byteLength));
				const wholeText = (chunk1Content + chunk2Content).repeat(100);

				const totalSize = wholeText.length;
				let fetchCount = 0;

				const blob = new XetBlob({
					hash: "test",
					size: totalSize,
					refreshUrl: "https://huggingface.co",
					listener: (e) => debugged.push(e),
					fetch: async function (_url, opts) {
						const url = new URL(_url as string);
						const headers = opts?.headers as Record<string, string> | undefined;

						switch (url.hostname) {
							case "huggingface.co": {
								// This is a token
								return new Response(
									JSON.stringify({
										casUrl: "https://cas.co",
										accessToken: "boo",
										exp: 1_000_000,
									}),
								);
							}
							case "cas.co": {
								// This is the reconstruction info
								const range = headers?.["Range"]?.slice("bytes=".length).split("-").map(Number);

								const start = range?.[0] ?? 0;
								// const end = range?.[1] ?? (totalSize - 1);

								return new Response(
									JSON.stringify({
										terms: Array(100)
											.fill(0)
											.map(() => ({
												hash: "test",
												range: {
													start: 0,
													end: 2,
												},
												unpacked_length: chunk1Content.length + chunk2Content.length,
											})),
										xorbs: {
											test: [
												{
													url: "https://fetch.co",
													ranges: [
														{
															chunks: { start: 0, end: 2 },
															bytes: { start: 0, end: totalChunkLength - 1 },
														},
													],
												},
											],
										},
										offset_into_first_range: start,
									} satisfies ReconstructionInfo),
								);
							}
							case "fetch.co": {
								fetchCount++;
								return new Response(
									new ReadableStream({
										pull(controller) {
											for (const chunk of chunks) {
												controller.enqueue(chunk);
											}
											controller.close();
										},
									}),
								);
							}
							default:
								throw new Error("Unhandled URL");
						}
					},
				});

				const startIndexes = [0, 5, 11, 6, 12, 100, totalSize - 12, totalSize - 2];

				for (const index of startIndexes) {
					console.log("slice", index);
					const content = await blob.slice(index).text();
					expect(content.length).toBe(wholeText.length - index);
					expect(content.slice(0, 1000)).toEqual(wholeText.slice(index).slice(0, 1000));
					expect(debugged.filter((e) => e.event === "read").length).toBe(totalChunkLength + 1); // 1 read for each chunk + 1 undefined
					expect(fetchCount).toEqual(1);

					fetchCount = 0;
					debugged.length = 0;
				}
			});
		});
	});
});

function makeChunk(content: string) {
	const encoded = new TextEncoder().encode(content);

	const array = new Uint8Array(encoded.length + 8);

	const dataView = new DataView(array.buffer);
	dataView.setUint8(0, 0); // version
	dataView.setUint8(1, encoded.length % 256); // Compressed length
	dataView.setUint8(2, (encoded.length >> 8) % 256); // Compressed length
	dataView.setUint8(3, (encoded.length >> 16) % 256); // Compressed length
	dataView.setUint8(4, 0); // Compression scheme
	dataView.setUint8(5, encoded.length % 256); // Uncompressed length
	dataView.setUint8(6, (encoded.length >> 8) % 256); // Uncompressed length
	dataView.setUint8(7, (encoded.length >> 16) % 256); // Uncompressed length

	array.set(encoded, 8);

	return array;
}

function splitChunk(chunk: Uint8Array, toLength: number): Uint8Array[] {
	const dataView = new DataView(chunk.buffer);
	return new Array(Math.ceil(chunk.byteLength / toLength)).fill(0).map((_, i) => {
		const array = new Uint8Array(Math.min(toLength, chunk.byteLength - i * toLength));

		for (let j = 0; j < array.byteLength; j++) {
			array[j] = dataView.getUint8(i * toLength + j);
		}
		return array;
	});
}
