import { describe, expect, it } from "vitest";
import type { ReconstructionInfo } from "./XetBlob";
import { bg4_regroup_bytes, bg4_split_bytes, XetBlob } from "./XetBlob";
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
		// 	"fetch_info":
		// 		{
		// 			"be748f77930d5929cabd510a15f2c30f2f460b639804ef79dea46affa04fd8b2":
		// 				[
		// 					{
		// 						"range": { "start": 0, "end": 5 },
		// 						"url": "...",
		// 						"url_range": { "start": 0, "end": 2839 },
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
										fetch_info: {
											test: [
												{
													url: "https://fetch.co",
													range: { start: 0, end: 2 },
													url_range: {
														start: 0,
														end: mergedChunks.byteLength / 1000 - 1,
													},
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
										fetch_info: {
											test0: [
												{
													url: "https://fetch.co",
													range: { start: 0, end: 2 },
													url_range: {
														start: 0,
														end: mergedChunks.byteLength - 1,
													},
												},
											],
											test1: [
												{
													url: "https://fetch.co",
													range: { start: 0, end: 2 },
													url_range: {
														start: 0,
														end: mergedChunks.byteLength - 1,
													},
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
										fetch_info: {
											test: [
												{
													url: "https://fetch.co",
													range: { start: 0, end: 2000 },
													url_range: {
														start: 0,
														end: totalChunkLength - 1,
													},
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
										fetch_info: {
											test: [
												{
													url: "https://fetch.co",
													range: { start: 0, end: 2 },
													url_range: {
														start: 0,
														end: totalChunkLength - 1,
													},
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
										fetch_info: {
											test: [
												{
													url: "https://fetch.co",
													range: { start: 0, end: 2 },
													url_range: {
														start: 0,
														end: totalChunkLength - 1,
													},
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

		describe("downloadConcurrency", () => {
			// Build a reconstruction spread over `termCount` distinct XORBs (one chunk
			// each), so the per-term CAS range requests are genuinely independent and
			// can overlap. The returned fetch counts how many range requests are in
			// flight at once, gated on a shared promise released by the test.
			function makeConcurrencyBlob(termCount: number, downloadConcurrency: number) {
				const contents = Array(termCount)
					.fill(0)
					.map((_, i) => `chunk-${i}-`);
				const chunks = contents.map((content) => makeChunk(content));
				const expected: number[] = [];
				for (const content of contents) {
					for (const byte of new TextEncoder().encode(content)) {
						expected.push(byte);
					}
				}
				const totalSize = sum(contents.map((c) => c.length));

				let inFlight = 0;
				let maxInFlight = 0;
				let release!: () => void;
				const released = new Promise<void>((r) => {
					release = r;
				});

				const blob = new XetBlob({
					hash: "test",
					size: totalSize,
					refreshUrl: "https://huggingface.co",
					downloadConcurrency,
					fetch: async function (_url) {
						const url = new URL(_url as string);

						switch (url.hostname) {
							case "huggingface.co": {
								return new Response(JSON.stringify({ casUrl: "https://cas.co", accessToken: "boo", exp: 1_000_000 }));
							}
							case "cas.co": {
								return new Response(
									JSON.stringify({
										terms: Array(termCount)
											.fill(0)
											.map((_, i) => ({
												hash: `xorb${i}`,
												range: { start: 0, end: 1 },
												unpacked_length: contents[i].length,
											})),
										fetch_info: Object.fromEntries(
											Array(termCount)
												.fill(0)
												.map((_, i) => [
													`xorb${i}`,
													[
														{
															url: `https://fetch.co/${i}`,
															range: { start: 0, end: 1 },
															url_range: { start: 0, end: chunks[i].byteLength - 1 },
														},
													],
												]),
										),
										offset_into_first_range: 0,
									} satisfies ReconstructionInfo),
								);
							}
							case "fetch.co": {
								// Range request for a single XORB: track concurrency, then wait
								// for the test to release before returning the body.
								inFlight++;
								maxInFlight = Math.max(maxInFlight, inFlight);
								await released;
								inFlight--;

								const i = Number(url.pathname.slice(1));
								const chunk = chunks[i];
								return new Response(
									new ReadableStream({
										pull(controller) {
											controller.enqueue(chunk);
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

				return { blob, expected: new Uint8Array(expected), release, getMaxInFlight: () => maxInFlight };
			}

			it("fetches reconstruction ranges in parallel when downloadConcurrency > 1", async () => {
				const { blob, expected, release, getMaxInFlight } = makeConcurrencyBlob(6, 4);

				const read = blob.arrayBuffer();
				// Let the scheduler launch its look-ahead window, then release the gated
				// range requests.
				await new Promise((r) => setTimeout(r, 20));
				release();

				const bytes = new Uint8Array(await read);

				expect(bytes).toEqual(expected);
				// With downloadConcurrency 4, the term being processed plus 3 look-ahead
				// requests can be in flight at once.
				expect(getMaxInFlight()).toBeGreaterThan(1);
			});

			it("keeps a single request in flight when downloadConcurrency is 1", async () => {
				const { blob, expected, release, getMaxInFlight } = makeConcurrencyBlob(6, 1);

				const read = blob.arrayBuffer();
				await new Promise((r) => setTimeout(r, 20));
				release();

				const bytes = new Uint8Array(await read);

				expect(bytes).toEqual(expected);
				expect(getMaxInFlight()).toBe(1);
			});

			it("cancels prefetched range requests when a download fails", async () => {
				const termCount = 3;
				const contents = Array(termCount)
					.fill(0)
					.map((_, i) => `chunk-${i}-`);
				const chunks = contents.map((content) => makeChunk(content));
				const totalSize = sum(contents.map((c) => c.length));

				// Track which prefetched range bodies get cancelled.
				const cancelled = new Set<number>();

				const blob = new XetBlob({
					hash: "test",
					size: totalSize,
					refreshUrl: "https://huggingface.co",
					downloadConcurrency: 4,
					fetch: async function (_url) {
						const url = new URL(_url as string);

						switch (url.hostname) {
							case "huggingface.co": {
								return new Response(JSON.stringify({ casUrl: "https://cas.co", accessToken: "boo", exp: 1_000_000 }));
							}
							case "cas.co": {
								return new Response(
									JSON.stringify({
										terms: Array(termCount)
											.fill(0)
											.map((_, i) => ({
												hash: `xorb${i}`,
												range: { start: 0, end: 1 },
												unpacked_length: contents[i].length,
											})),
										fetch_info: Object.fromEntries(
											Array(termCount)
												.fill(0)
												.map((_, i) => [
													`xorb${i}`,
													[
														{
															url: `https://fetch.co/${i}`,
															range: { start: 0, end: 1 },
															url_range: { start: 0, end: chunks[i].byteLength - 1 },
														},
													],
												]),
										),
										offset_into_first_range: 0,
									} satisfies ReconstructionInfo),
								);
							}
							case "fetch.co": {
								const i = Number(url.pathname.slice(1));
								if (i === 0) {
									// The first (consumed) term fails, aborting the whole download.
									return new Response("boom", { status: 500 });
								}
								// Prefetched terms: their bodies must be cancelled on failure.
								return new Response(
									new ReadableStream({
										pull(controller) {
											controller.enqueue(chunks[i]);
											controller.close();
										},
										cancel() {
											cancelled.add(i);
										},
									}),
								);
							}
							default:
								throw new Error("Unhandled URL");
						}
					},
				});

				await expect(blob.arrayBuffer()).rejects.toBeDefined();
				// Let the fire-and-forget body cancellations settle.
				await new Promise((r) => setTimeout(r, 20));

				expect(cancelled.has(1)).toBe(true);
				expect(cancelled.has(2)).toBe(true);
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
										fetch_info: {
											test: [
												{
													url: "https://fetch.co",
													range: { start: 0, end: 2 },
													url_range: {
														start: 0,
														end: totalChunkLength - 1,
													},
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
