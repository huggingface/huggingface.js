import { describe, expect, it } from "vitest";
import { bg4_regoup_bytes, XetBlob } from "./XetBlob";

describe("XetBlob", () => {
	it("should lazy load the first 22 bytes", async () => {
		const blob = new XetBlob({
			repo: {
				type: "model",
				name: "celinah/xet-experiments",
			},
			hash: "7b3b6d07673a88cf467e67c1f7edef1a8c268cbf66e9dd9b0366322d4ab56d9b",
			size: 5_234_139_343,
		});

		expect(await blob.slice(10, 22).text()).toBe("__metadata__");
	}, 30_000);

	it("should load the first chunk correctly", async () => {
		let xorbCount = 0;
		const blob = new XetBlob({
			repo: {
				type: "model",
				name: "celinah/xet-experiments",
			},
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
			}
		).then((res) => res.arrayBuffer());

		expect(new Uint8Array(xetDownload)).toEqual(new Uint8Array(bridgeDownload));
		expect(xorbCount).toBe(1);
	}, 30_000);

	it("should load just past the first chunk correctly", async () => {
		let xorbCount = 0;
		const blob = new XetBlob({
			repo: {
				type: "model",
				name: "celinah/xet-experiments",
			},
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
			}
		).then((res) => res.arrayBuffer());

		expect(new Uint8Array(xetDownload)).toEqual(new Uint8Array(bridgeDownload));
		expect(xetDownload.byteLength).toBe(29929);
		expect(xorbCount).toBe(2);
	});

	it("should load correctly when loading far into a chunk range", async () => {
		const blob = new XetBlob({
			repo: {
				type: "model",
				name: "celinah/xet-experiments",
			},
			hash: "7b3b6d07673a88cf467e67c1f7edef1a8c268cbf66e9dd9b0366322d4ab56d9b",
			size: 5_234_139_343,
		});

		const xetDownload = await blob.slice(10_000_000, 10_100_000).arrayBuffer();
		const bridgeDownload = await fetch(
			"https://huggingface.co/celinah/xet-experiments/resolve/main/model5GB.safetensors",
			{
				headers: {
					Range: "bytes=10000000-10100000",
				},
			}
		).then((res) => res.arrayBuffer());

		expect(new Uint8Array(xetDownload)).toEqual(new Uint8Array(bridgeDownload));
	});

	it("should load text correctly when offset_into_range starts in a chunk further than the first", async () => {
		const blob = new XetBlob({
			repo: {
				type: "model",
				name: "celinah/xet-experiments",
			},
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

		expect(text.length).toBe(bridgeDownload.length);
	});

	describe("bg4_regoup_bytes", () => {
		it("should regroup bytes when the array is %4 length", () => {
			expect(bg4_regoup_bytes(new Uint8Array([1, 5, 2, 6, 3, 7, 4, 8]))).toEqual(
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
			);
		});

		it("should regroup bytes when the array is %4 + 1 length", () => {
			expect(bg4_regoup_bytes(new Uint8Array([1, 5, 9, 2, 6, 3, 7, 4, 8]))).toEqual(
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
			);
		});

		it("should regroup bytes when the array is %4 + 2 length", () => {
			expect(bg4_regoup_bytes(new Uint8Array([1, 5, 9, 2, 6, 10, 3, 7, 4, 8]))).toEqual(
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
			);
		});

		it("should regroup bytes when the array is %4 + 3 length", () => {
			expect(bg4_regoup_bytes(new Uint8Array([1, 5, 9, 2, 6, 10, 3, 7, 11, 4, 8]))).toEqual(
				new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
			);
		});
	});
});
