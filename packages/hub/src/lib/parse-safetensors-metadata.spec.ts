import { assert, expect, it, describe } from "vitest";
import {
	parseSafetensorsMetadata,
	parseSafetensorsShardFilename,
	globMatch,
	isQuantizedTensor,
	matchesCompressedTensorsTarget,
	computeNumOfParamsByDtypeSingleFile,
	getQuantizationMultiplier,
	validateTensorEntry,
	parseTotalParameters,
} from "./parse-safetensors-metadata";
import type { Dtype, TensorInfo, SafetensorsFileHeader } from "./parse-safetensors-metadata";
import { sum } from "../utils/sum";

describe("parseSafetensorsMetadata", () => {
	it("fetch info for single-file (with the default conventional filename)", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "google-bert/bert-base-uncased",
			computeParametersCount: true,
			revision: "86b5e0934494bd15c9632b12f734a8a67f723594",
		});

		assert(!parse.sharded);
		assert.deepStrictEqual(parse.header.__metadata__, { format: "pt" });

		// Example of one tensor (the header contains many tensors)

		assert.deepStrictEqual(parse.header["bert.embeddings.LayerNorm.beta"], {
			dtype: "F32",
			shape: [768],
			data_offsets: [0, 3072],
		});

		assert.deepStrictEqual(parse.parameterCount, { F32: 110_106_428 });
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 110_106_428);
		// total params = 110m

		assert.deepStrictEqual(parse.filepaths, ["model.safetensors"]);
	});

	it("fetch info for sharded (with the default conventional filename)", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "bigscience/bloom",
			computeParametersCount: true,
			revision: "053d9cd9fbe814e091294f67fcfedb3397b954bb",
		});

		assert(parse.sharded);

		assert.strictEqual(Object.keys(parse.headers).length, 72);
		// This model has 72 shards!

		// Example of one tensor inside one file

		assert.deepStrictEqual(parse.headers["model_00012-of-00072.safetensors"]["h.10.input_layernorm.weight"], {
			dtype: "BF16",
			shape: [14336],
			data_offsets: [3288649728, 3288678400],
		});

		assert.deepStrictEqual(parse.parameterCount, { BF16: 176_247_271_424 });
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 176_247_271_424);
		// total params = 176B

		assert.strictEqual(parse.filepaths[0], "model.safetensors.index.json");
		assert.strictEqual(parse.filepaths.length, 73); // 1 index + 72 shards
		assert.ok(parse.filepaths.includes("model_00012-of-00072.safetensors"));
	});

	it("fetch info for single-file with multiple dtypes", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "roberta-base",
			computeParametersCount: true,
			revision: "e2da8e2f811d1448a5b465c236feacd80ffbac7b",
		});

		assert(!parse.sharded);

		assert.deepStrictEqual(parse.parameterCount, { F32: 124_697_433, I64: 514 });
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 124_697_947);
		// total params = 124m
	});

	it("fetch info for single-file with file path", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "CompVis/stable-diffusion-v1-4",
			computeParametersCount: true,
			path: "unet/diffusion_pytorch_model.safetensors",
			revision: "133a221b8aa7292a167afc5127cb63fb5005638b",
		});

		assert(!parse.sharded);
		assert.deepStrictEqual(parse.header.__metadata__, { format: "pt" });

		// Example of one tensor (the header contains many tensors)

		assert.deepStrictEqual(parse.header["up_blocks.3.resnets.0.norm2.bias"], {
			dtype: "F32",
			shape: [320],
			data_offsets: [3_409_382_416, 3_409_383_696],
		});

		assert.deepStrictEqual(parse.parameterCount, { F32: 859_520_964 });
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 859_520_964);

		assert.deepStrictEqual(parse.filepaths, ["unet/diffusion_pytorch_model.safetensors"]);
	});

	it("resolves diffusers weights from the unet/ subfolder via the library hint (no path given)", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "CompVis/stable-diffusion-v1-4",
			computeParametersCount: true,
			library: "diffusers",
			revision: "133a221b8aa7292a167afc5127cb63fb5005638b",
		});

		assert(!parse.sharded);
		assert.deepStrictEqual(parse.filepaths, ["unet/diffusion_pytorch_model.safetensors"]);
		assert.deepStrictEqual(parse.parameterCount, { F32: 859_520_964 });
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 859_520_964);
	});

	it("resolves sharded diffusers weights from the transformer/ subfolder via the library hint", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "Qwen/Qwen-Image",
			computeParametersCount: true,
			library: "diffusers",
			revision: "75e0b4be04f60ec59a75f475837eced720f823b6",
		});

		assert(parse.sharded);
		assert.strictEqual(parse.filepaths[0], "transformer/diffusion_pytorch_model.safetensors.index.json");
		assert.ok(parse.filepaths.includes("transformer/diffusion_pytorch_model-00001-of-00009.safetensors"));
		assert.strictEqual(parse.filepaths.length, 10); // 1 index + 9 shards
		// Qwen-Image's diffusion transformer is ~20.4B params
		assert.deepStrictEqual(parse.parameterCount, { BF16: 20_430_401_088 });
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 20_430_401_088);
	});

	it("fetch info for sharded with file path", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "Alignment-Lab-AI/ALAI-gemma-7b",
			computeParametersCount: true,
			path: "7b/1/model.safetensors.index.json",
			revision: "37e307261fe97bbf8b2463d61dbdd1a10daa264c",
		});

		assert(parse.sharded);

		assert.strictEqual(Object.keys(parse.headers).length, 4);

		assert.deepStrictEqual(parse.headers["model-00004-of-00004.safetensors"]["model.layers.24.mlp.up_proj.weight"], {
			dtype: "BF16",
			shape: [24576, 3072],
			data_offsets: [301996032, 452990976],
		});

		assert.deepStrictEqual(parse.parameterCount, { BF16: 8_537_680_896 });
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 8_537_680_896);

		assert.strictEqual(parse.filepaths[0], "7b/1/model.safetensors.index.json");
		assert.strictEqual(parse.filepaths.length, 5); // 1 index + 4 shards
		assert.ok(parse.filepaths.includes("7b/1/model-00001-of-00004.safetensors"));
		assert.ok(parse.filepaths.includes("7b/1/model-00004-of-00004.safetensors"));
	});

	it("fetch info for sharded, but get param count directly from metadata", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "hf-internal-testing/sharded-model-metadata-num-parameters",
			computeParametersCount: true,
			revision: "999395eb3db277f3d7a0393402b02486ca91cef8",
		});

		assert(parse.sharded);
		assert.deepStrictEqual(parse.parameterTotal, 109_482_240);
		// total params = 109M
	});

	it("fetch info for single-file, but get param count directly from metadata", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "hf-internal-testing/single-file-model",
			computeParametersCount: true,
			revision: "75fcd3fed0285ac7f1092897ff2aefdf24bf872e",
		});

		assert(!parse.sharded);
		assert.deepStrictEqual(parse.parameterTotal, 109_482_240);
	});

	describe("malformed headers (crafted parameter counts)", () => {
		/**
		 * Builds the bytes of a minimal safetensors file from a JSON header plus a data buffer,
		 * and a fetch that serves it (including the `Range: bytes=0-0` probe `WebBlob.create`
		 * uses to learn the file size).
		 */
		const fetchForFile = (header: Record<string, unknown>, dataBytes = 0): typeof fetch => {
			const headerBytes = new TextEncoder().encode(JSON.stringify(header));
			const file = new Uint8Array(8 + headerBytes.length + dataBytes);
			new DataView(file.buffer).setBigUint64(0, BigInt(headerBytes.length), true);
			file.set(headerBytes, 8);
			return (async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
				if (!url.endsWith(".safetensors")) {
					// config.json, the sharded index, existence probes... — `downloadFile` treats a
					// 404 as "not found" only when the Hub's X-Error-Code says so.
					return new Response(null, { status: 404, headers: { "X-Error-Code": "EntryNotFound" } });
				}
				const range = new Headers(init?.headers).get("range");
				if (range?.startsWith("bytes=")) {
					const [start, endRaw] = range.slice("bytes=".length).split("-");
					const startByte = Number(start);
					const endByte = endRaw === "" ? file.length - 1 : Number(endRaw);
					return new Response(file.slice(startByte, endByte + 1), {
						status: 206,
						headers: {
							"content-range": `bytes ${startByte}-${endByte}/${file.length}`,
							etag: '"hermetic-test-file"',
						},
					});
				}
				return new Response(file, { status: 200, headers: { etag: '"hermetic-test-file"' } });
			}) as typeof fetch;
		};

		it("rejects absurd tensor dims (the 1.8e308-param single-file PoC shape)", async () => {
			const fetch = fetchForFile(
				{
					__metadata__: { format: "pt" },
					"model.qmoe.experts": {
						dtype: "F4",
						shape: [4611686018427387904, 4611686018427387904, 4294967296],
						data_offsets: [0, 4],
					},
					"model.qmoe.router": { dtype: "F4", shape: [24, 1024, 962], data_offsets: [4, 8] },
				},
				8,
			);

			await expect(
				parseSafetensorsMetadata({
					repo: "some-user/fake-huge-model",
					computeParametersCount: true,
					fetch,
				}),
			).rejects.toThrow(/exceeds the maximum allowed/);
		});

		it("rejects plausible dims whose data_offsets exceed the file size (the fake 16T shard shape)", async () => {
			// 673-byte shard claiming 10 tensors of [65536, 65536] F4 spanning 2GB each.
			const fetch = fetchForFile(
				Object.fromEntries([
					["__metadata__", { format: "pt" }],
					...Array.from({ length: 10 }, (_, i) => [
						`model.experts.${i}.w`,
						{ dtype: "F4", shape: [65536, 65536], data_offsets: [i * 2147483648, (i + 1) * 2147483648] },
					]),
				]),
				0,
			);

			await expect(
				parseSafetensorsMetadata({
					repo: "some-user/fake-16t-model",
					computeParametersCount: true,
					fetch,
				}),
			).rejects.toThrow(/exceeds the file size/);
		});

		it("caps a self-reported total_parameters above the computed count", async () => {
			const fetch = fetchForFile(
				{
					__metadata__: { format: "pt", total_parameters: "999000000000" },
					weight: { dtype: "F32", shape: [10, 20], data_offsets: [0, 800] },
				},
				800,
			);

			const parse = await parseSafetensorsMetadata({
				repo: "some-user/inflated-metadata-model",
				computeParametersCount: true,
				fetch,
			});

			assert(!parse.sharded);
			assert.deepStrictEqual(parse.parameterCount, { F32: 200 });
			assert.strictEqual(parse.parameterTotal, 200);
		});

		it("keeps trusting a well-formed file and its metadata shortcut", async () => {
			const fetch = fetchForFile(
				{
					__metadata__: { format: "pt", total_parameters: "200" },
					weight: { dtype: "F32", shape: [10, 20], data_offsets: [0, 800] },
				},
				800,
			);

			const parse = await parseSafetensorsMetadata({
				repo: "some-user/well-formed-model",
				computeParametersCount: true,
				fetch,
			});

			assert(!parse.sharded);
			assert.deepStrictEqual(parse.parameterCount, { F32: 200 });
			assert.strictEqual(parse.parameterTotal, 200);
		});

		it("skips the offsets check (rather than guessing) when the file size is unknown", () => {
			// A custom fetch whose returned blob doesn't report a size leaves the total unknown;
			// validation must not block the parse on a guess in that case.
			expect(() =>
				validateTensorEntry(
					"model.safetensors",
					"model.experts.0.w",
					{ dtype: "F4", shape: [65536, 65536], data_offsets: [0, 2147483648] },
					undefined,
				),
			).not.toThrow();
		});

		it("parseTotalParameters only caps at the computed count", () => {
			// inflated -> capped; honest -> untouched; missing computed count -> taken as-is
			assert.strictEqual(parseTotalParameters("999000000000", 200), 200);
			assert.strictEqual(parseTotalParameters("200", 200), 200);
			assert.strictEqual(parseTotalParameters(150, 200), 150);
			assert.strictEqual(parseTotalParameters("999000000000", undefined), 999000000000);
			assert.strictEqual(parseTotalParameters("not-a-number", 200), undefined);
			assert.strictEqual(parseTotalParameters(undefined, 200), undefined);
		});
	});

	it("should detect sharded safetensors filename", async () => {
		const safetensorsFilename = "model_00005-of-00072.safetensors"; // https://huggingface.co/bigscience/bloom/blob/4d8e28c67403974b0f17a4ac5992e4ba0b0dbb6f/model_00005-of-00072.safetensors
		const safetensorsShardFileInfo = parseSafetensorsShardFilename(safetensorsFilename);

		assert.strictEqual(safetensorsShardFileInfo?.prefix, "model_");
		assert.strictEqual(safetensorsShardFileInfo?.basePrefix, "model");
		assert.strictEqual(safetensorsShardFileInfo?.shard, "00005");
		assert.strictEqual(safetensorsShardFileInfo?.total, "00072");
	});

	it("should detect sharded safetensors filename with 6 digits", async () => {
		const safetensorsFilename = "model-00001-of-000163.safetensors"; // https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp/blob/main/model-00001-of-000163.safetensors
		const safetensorsShardFileInfo = parseSafetensorsShardFilename(safetensorsFilename);

		assert.strictEqual(safetensorsShardFileInfo?.prefix, "model-");
		assert.strictEqual(safetensorsShardFileInfo?.basePrefix, "model");
		assert.strictEqual(safetensorsShardFileInfo?.shard, "00001");
		assert.strictEqual(safetensorsShardFileInfo?.total, "000163");
	});

	describe("sub-byte data types", () => {
		const tensor = (dtype: Dtype, shape: number[]): TensorInfo => ({ dtype, shape, data_offsets: [0, 0] });
		/// `__metadata__` is always present in a real header and must never be counted as a tensor.
		const header = (tensors: Record<string, TensorInfo>): SafetensorsFileHeader => {
			const built: SafetensorsFileHeader = { ...tensors };
			built.__metadata__ = { format: "pt" };
			return built;
		};

		it("counts sub-byte weight dtypes at face value", () => {
			// These hold weights directly rather than being packed into an integer container, so one
			// element is one parameter.
			const parameterCount = computeNumOfParamsByDtypeSingleFile(
				header({
					tensor_f4: tensor("F4", [10, 20]),
					tensor_fp4: tensor("FP4", [100, 200]),
					tensor_f6_e2m3: tensor("F6_E2M3", [5, 10]),
					tensor_f6_e3m2: tensor("F6_E3M2", [8, 12]),
				}),
			);

			assert.deepStrictEqual(parameterCount, { F4: 200, FP4: 20_000, F6_E2M3: 50, F6_E3M2: 96 });
		});

		it("never counts exponent-only dtypes, even with no quantization_config", () => {
			// E8M0 / UE8 / F8_E8M0 exist solely to hold MX-style block scales, so they are never
			// parameters — and a model can ship them without declaring a quantization_config at all.
			const parameterCount = computeNumOfParamsByDtypeSingleFile(
				header({
					weights: tensor("F4", [10, 20]),
					scales_e8m0: tensor("E8M0", [4, 6]),
					scales_ue8: tensor("UE8", [50, 100]),
					scales_f8_e8m0: tensor("F8_E8M0", [7, 8]),
				}),
			);

			assert.deepStrictEqual(parameterCount, { F4: 200 });
		});

		it("skips scalar tensors", () => {
			const parameterCount = computeNumOfParamsByDtypeSingleFile(
				header({
					scalar: tensor("F32", []),
					real: tensor("F32", [3, 4]),
				}),
			);

			assert.deepStrictEqual(parameterCount, { F32: 12 });
		});
	});

	it("fetch info for GPTQ quantized 8B model", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16",
			revision: "3921b6aee65496a708b0af456c964ceca7423193",
			computeParametersCount: true,
		});

		const parameterCount = parse.parameterCount;
		assert.ok(parameterCount);
		assert.ok(parameterCount.I32);
		assert.ok(parameterCount.F16);
		assert.strictEqual(parameterCount.I32, 6_979_321_856);
		assert.strictEqual(parameterCount.F16, 1_052_315_648);

		const parameterCountTotal =
			parse.parameterTotal ??
			sum(
				Object.entries(parameterCount)
					.filter(([, value]) => typeof value === "number")
					.map(([, value]) => value as number),
			);

		assert.strictEqual(parameterCountTotal, 8_031_637_504);
	});

	it("fetch info for openai/gpt-oss-20b (large sharded model)", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "openai/gpt-oss-20b",
			computeParametersCount: true,
			revision: "bbf09307421df45099c1e7dcbd64e3106ce5b403",
		});

		assert(parse.sharded);

		assert.ok(Object.keys(parse.headers).length > 1);
		assert.ok(parse.parameterCount);

		const totalParams = parse.parameterTotal || sum(Object.values(parse.parameterCount));

		// 20.9B, matching OpenAI's published figure. Previously 21_511_953_984, which counted the
		// 597_196_800 `..._scales` UE8M0 block exponents as parameters (+2.86%).
		assert.strictEqual(totalParams, 20_914_757_184);
		assert.deepStrictEqual(parse.parameterCount, { BF16: 1_804_459_584, U8: 19_110_297_600 });

		assert.strictEqual(Object.keys(parse.headers).length, 3);
	});

	it("excludes mxfp4 block scales stored as `..._scales` (openai/gpt-oss-120b)", async () => {
		// gpt-oss joins the scales suffix with an underscore rather than a dot, so it slips past the
		// dotted auxiliary-suffix list. Counting the 3_583_180_800 U8 scales reported 120_412_337_472
		// (120.4B) for a model OpenAI documents as 116.8B / "117B".
		const parse = await parseSafetensorsMetadata({
			repo: "openai/gpt-oss-120b",
			revision: "b5c939de8f754692c1647ca79fbf85e8c1e70f8a",
			computeParametersCount: true,
		});

		assert(parse.sharded);
		assert.strictEqual(Object.keys(parse.headers).length, 15);
		assert.deepStrictEqual(parse.parameterCount, {
			BF16: 2_167_371_072,
			U8: 114_661_785_600, // 57_330_892_800 packed bytes x 2, scales excluded
		});
		assert.strictEqual(sum(Object.values(parse.parameterCount)), 116_829_156_672);
	});

	it("excludes bitsandbytes double-quantization state (unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit)", async () => {
		// `absmax` shares the weights' U8 container, so it was counted *and* doubled by the 4-bit
		// packing factor — the same double error `weight_shape` had. Reported 8_248_929_342 for a
		// model whose true size is Llama-3.1-8B's 8_030_261_248 (+2.72%).
		const parse = await parseSafetensorsMetadata({
			repo: "unsloth/Meta-Llama-3.1-8B-Instruct-bnb-4bit",
			revision: "f15c379fb32bb402fa06a7ae9aecb1febf4b79ec",
			computeParametersCount: true,
		});

		assert(!parse.sharded);
		assert.deepStrictEqual(parse.parameterCount, {
			BF16: 1_050_939_392,
			U8: 6_979_321_856, // 3_489_660_928 packed bytes x 2
		});
		assert.strictEqual(sum(Object.values(parse.parameterCount)), 8_030_261_248);
		// the nested quant state (`nested_absmax` / `nested_quant_map` / `quant_map`) was the whole
		// of the previously reported F32 count, so the dtype drops out entirely
		assert.strictEqual(parse.parameterCount.F32, undefined);
	});

	it("excludes compressed-tensors `weight_g_idx` actorder indices (RedHatAI/Llama-3.3-70B-Instruct-quantized.w4a16)", async () => {
		// `actorder: "group"` makes the pack-quantized compressor emit one I32 permutation index per
		// input column. Being an integer container it was counted *and* multiplied by the packing
		// factor: 6_225_920 indices x 8 = 49_807_360 phantom parameters.
		const parse = await parseSafetensorsMetadata({
			repo: "RedHatAI/Llama-3.3-70B-Instruct-quantized.w4a16",
			revision: "7177921dd02c6436cc78d40861f497df2f575201",
			computeParametersCount: true,
		});

		assert(parse.sharded);
		assert.strictEqual(Object.keys(parse.headers).length, 8);
		assert.deepStrictEqual(parse.parameterCount, {
			I32: 68_451_041_280,
			BF16: 2_102_665_216,
		});
		// exactly the unquantized meta-llama/Llama-3.3-70B-Instruct parameter count
		assert.strictEqual(sum(Object.values(parse.parameterCount)), 70_553_706_496);
		// `weight_shape` is `torch.tensor(shape)`, i.e. I64 here rather than I32 — also excluded
		assert.strictEqual(parse.parameterCount.I64, undefined);
	});

	describe("getQuantizationMultiplier", () => {
		const EXPERT = "model.layers.0.ffn.experts.3.w1.weight";

		describe("fp8 with expert_dtype", () => {
			const fp8 = { quant_method: "fp8" };

			it("packs routed experts at the declared expert width", () => {
				// DeepSeek-V4-Pro: fp8 attention, fp4 experts packed two-per-byte in I8
				assert.strictEqual(getQuantizationMultiplier(EXPERT, "I8", fp8, "fp4"), 2);
			});

			it("leaves shared experts alone — they're dense, not routed", () => {
				const shared = "model.layers.0.ffn.shared_experts.w1.weight";
				assert.strictEqual(getQuantizationMultiplier(shared, "I8", fp8, "fp4"), 1);
			});

			it("does not apply the expert width to non-expert integer tensors", () => {
				// The bug this guards: `expert_dtype` used to apply to every integer container, so a
				// routing table or other bookkeeping was inflated by the packing factor — 8x for I32.
				assert.strictEqual(getQuantizationMultiplier("model.layers.0.ffn.gate.tid2eid", "I32", fp8, "fp4"), 1);
				assert.strictEqual(getQuantizationMultiplier("model.layers.0.attn.wkv.weight", "I8", fp8, "fp4"), 1);
			});

			it("leaves fp8 experts unpacked — one value per byte", () => {
				assert.strictEqual(getQuantizationMultiplier(EXPERT, "F8_E4M3", fp8, "fp4"), 1);
				assert.strictEqual(getQuantizationMultiplier(EXPERT, "I8", fp8, "fp8"), 1);
			});

			it("is a no-op without expert_dtype", () => {
				assert.strictEqual(getQuantizationMultiplier(EXPERT, "I8", fp8, undefined), 1);
			});
		});

		describe("compressed-tensors packing factor", () => {
			const packed = (numBits: number) => ({
				quant_method: "compressed-tensors",
				format: "pack-quantized",
				config_groups: { group_0: { weights: { num_bits: numBits } } },
			});
			const name = "model.layers.0.mlp.down_proj.weight_packed";

			it("packs 4-bit eight-per-I32 and two-per-U8", () => {
				assert.strictEqual(getQuantizationMultiplier(name, "I32", packed(4)), 8);
				assert.strictEqual(getQuantizationMultiplier(name, "U8", packed(4)), 2);
			});

			it("packs 2-bit sixteen-per-I32", () => {
				assert.strictEqual(getQuantizationMultiplier(name, "I32", packed(2)), 16);
			});

			it("uses the exact ratio for widths that don't divide the container", () => {
				// Dense cross-element packing: 32 values occupy exactly num_bits I32 words, so an I32
				// holds 32/3 values. Flooring to 10 undercounts a 3-bit model by 6%.
				assert.strictEqual(getQuantizationMultiplier(name, "I32", packed(3)), 32 / 3);
				assert.strictEqual(getQuantizationMultiplier(name, "I32", packed(5)), 32 / 5);
			});

			it("does not pack when the width fills the container", () => {
				assert.strictEqual(getQuantizationMultiplier(name, "I8", packed(8)), 1);
			});
		});

		it("ignores fp6, which is stored in native F6_* dtypes rather than packed", () => {
			// A 6-bit width in an 8-bit container has no reference implementation, so claiming any
			// packing for it would be a guess.
			assert.strictEqual(getQuantizationMultiplier(EXPERT, "U8", { quant_method: "fp8" }, "fp6"), 1);
			assert.strictEqual(getQuantizationMultiplier(EXPERT, "F6_E2M3", { quant_method: "fp8" }, "fp6"), 1);
		});
	});

	describe("globMatch", () => {
		it("exact match when no wildcard", () => {
			assert.strictEqual(globMatch("foo", "foo"), true);
			assert.strictEqual(globMatch("foo", "foobar"), false);
			assert.strictEqual(globMatch("foo", "xfoo"), false);
			assert.strictEqual(globMatch("foo", "xfoox"), false);
		});

		it("single leading wildcard (*.ext)", () => {
			assert.strictEqual(globMatch("*.txt", "file.txt"), true);
			assert.strictEqual(globMatch("*.txt", ".txt"), true);
			assert.strictEqual(globMatch("*.txt", "file.txt.bak"), false);
			assert.strictEqual(globMatch("*.txt", "txt"), false);
		});

		it("single trailing wildcard (prefix.*)", () => {
			assert.strictEqual(globMatch("model.*", "model.bin"), true);
			assert.strictEqual(globMatch("model.*", "model."), true);
			assert.strictEqual(globMatch("model.*", "my_model.bin"), false);
		});

		it("wildcard on both sides (*mid*)", () => {
			assert.strictEqual(globMatch("*layer*", "model.layer.weight"), true);
			assert.strictEqual(globMatch("*layer*", "layer"), true);
			assert.strictEqual(globMatch("*layer*", "no_match"), false);
		});

		it("multiple wildcards", () => {
			assert.strictEqual(globMatch("a*b*c", "abc"), true);
			assert.strictEqual(globMatch("a*b*c", "aXXbYYc"), true);
			assert.strictEqual(globMatch("a*b*c", "aXXbYY"), false);
			assert.strictEqual(globMatch("a*b*c", "XXbYYc"), false);
		});

		it("wildcard-only pattern matches anything", () => {
			assert.strictEqual(globMatch("*", "anything"), true);
			assert.strictEqual(globMatch("*", ""), true);
		});

		it("typical quantization config patterns", () => {
			assert.strictEqual(globMatch("lm_head", "lm_head"), true);
			assert.strictEqual(globMatch("lm_head", "model.lm_head"), false);
			assert.strictEqual(globMatch("*lm_head*", "model.lm_head.weight"), true);
		});

		it("bare module names match via substring in isQuantizedTensor context", () => {
			// globMatch itself is a strict glob matcher — no wildcard means exact match
			assert.strictEqual(globMatch("lm_head", "model.lm_head.weight"), false);
			// But isQuantizedTensor uses substring matching for bare names (no *)
			// to match Python transformers behavior. See isQuantizedTensor tests below.
		});
	});

	describe("isQuantizedTensor", () => {
		const makeConfig = (modules: string[]) => ({
			quant_method: "bitsandbytes" as const,
			modules_to_not_convert: modules,
		});

		it("returns false when no quantization config", () => {
			assert.strictEqual(isQuantizedTensor("model.layer.weight", undefined), false);
		});

		it("returns true when modules_to_not_convert is empty", () => {
			assert.strictEqual(isQuantizedTensor("model.layer.weight", makeConfig([])), true);
		});

		it("bare module name excludes tensors containing that substring (Python compat)", () => {
			const config = makeConfig(["lm_head"]);
			assert.strictEqual(isQuantizedTensor("model.lm_head.weight", config), false);
			assert.strictEqual(isQuantizedTensor("lm_head", config), false);
			assert.strictEqual(isQuantizedTensor("lm_head.weight", config), false);
			assert.strictEqual(isQuantizedTensor("model.embed_tokens.weight", config), true);
		});

		it("glob pattern with wildcards uses globMatch", () => {
			const config = makeConfig(["*lm_head*"]);
			assert.strictEqual(isQuantizedTensor("model.lm_head.weight", config), false);
			assert.strictEqual(isQuantizedTensor("model.embed_tokens.weight", config), true);
		});

		it("honours the compressed-tensors `ignore` list", () => {
			const quantConfig = {
				quant_method: "compressed-tensors",
				format: "mxfp4-pack-quantized",
				ignore: ["re:.*self_attn.*", "re:.*lm_head.*"],
			};
			assert.strictEqual(isQuantizedTensor("model.layers.0.self_attn.q_proj.weight", quantConfig), false);
			assert.strictEqual(isQuantizedTensor("model.lm_head.weight", quantConfig), false);
			assert.strictEqual(isQuantizedTensor("model.layers.0.mlp.experts.0.weight", quantConfig), true);
		});

		it("multiple exclusion patterns", () => {
			const config = makeConfig(["lm_head", "embed_tokens"]);
			assert.strictEqual(isQuantizedTensor("model.lm_head.weight", config), false);
			assert.strictEqual(isQuantizedTensor("model.embed_tokens.weight", config), false);
			assert.strictEqual(isQuantizedTensor("model.layers.0.self_attn.q_proj.weight", config), true);
		});
	});

	describe("matchesCompressedTensorsTarget", () => {
		it("exact module name match", () => {
			assert.strictEqual(
				matchesCompressedTensorsTarget("model.language_model.embed_tokens", "model.language_model.embed_tokens"),
				true,
			);
			assert.strictEqual(
				matchesCompressedTensorsTarget(
					"model.language_model.embed_tokens",
					"model.language_model.embed_tokens_per_layer",
				),
				false,
			);
		});

		it("class-name targets do not match module names", () => {
			assert.strictEqual(matchesCompressedTensorsTarget("Linear", "model.layers.0.mlp.down_proj"), false);
		});

		it("re: targets with .* wildcard and $ anchor", () => {
			assert.strictEqual(matchesCompressedTensorsTarget("re:.*lm_head$", "model.lm_head"), true);
			assert.strictEqual(matchesCompressedTensorsTarget("re:.*lm_head$", "model.lm_head.weight"), false);
			assert.strictEqual(matchesCompressedTensorsTarget("re:.*lm_head$", "lm_head"), true);
		});

		it("re: targets are anchored at the start, open-ended without $", () => {
			assert.strictEqual(matchesCompressedTensorsTarget("re:model\\.layers.*", "model.layers.0.mlp.gate_proj"), true);
			assert.strictEqual(matchesCompressedTensorsTarget("re:model\\.layers.*", "lm.model.layers.0"), false);
			assert.strictEqual(matchesCompressedTensorsTarget("re:^model\\.layers.*", "model.layers.0"), true);
		});

		it("re: targets with unsupported regex syntax never match", () => {
			assert.strictEqual(
				matchesCompressedTensorsTarget("re:.*mlp\\.(gate|up)_proj.*", "model.layers.0.mlp.gate_proj"),
				false,
			);
			assert.strictEqual(matchesCompressedTensorsTarget("re:(a+)+$", "aaaaaaaaaaaaaaaaaaaaab"), false);
		});
	});

	it("fetch info for moonshotai/Kimi-K2.5 (large index file >20MB)", async () => {
		// This model has a ~23.5MB index file due to having many experts
		const parse = await parseSafetensorsMetadata({
			repo: "moonshotai/Kimi-K2.5",
			revision: "2426b45b6af0da48d0dcce71bbce6225e5c73adc",
			computeParametersCount: true,
		});

		assert(parse.sharded);
		assert.strictEqual(Object.keys(parse.headers).length, 64);
		// `weight_scale` (BF16, group_size 32 -> ~31.7B of them) and `weight_shape` (I32 bookkeeping)
		// are quantization metadata, not parameters, so they are excluded — as GPTQ/AWQ `scales`
		// already were. This lowers the previously reported total by ~3%.
		assert.deepStrictEqual(parse.parameterCount, { F32: 23_040, I32: 1_014_686_023_680, BF16: 12_193_329_648 });
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 1_026_879_376_368);
	});

	it("counts mxfp4-pack-quantized compressed-tensors weights packed in U8 (moonshotai/Kimi-K3)", async () => {
		// compressed-tensors + `format: "mxfp4-pack-quantized"`, 4-bit weights two-per-byte in U8.
		// Previously the U8 weights got multiplier 1 and the U8 `weight_scale` tensors were counted,
		// reporting 1.50T instead of 2.78T.
		const parse = await parseSafetensorsMetadata({
			repo: "moonshotai/Kimi-K3",
			revision: "9f62e4e9fffbd0a83ddd60e1c209d828994b3569",
			computeParametersCount: true,
		});

		assert(parse.sharded);
		assert.strictEqual(Object.keys(parse.headers).length, 96);
		assert.deepStrictEqual(parse.parameterCount, {
			F32: 11_122_432,
			BF16: 57_179_884_544,
			U8: 2_722_740_830_208, // 1_361_370_415_104 packed bytes x 2
		});
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 2_779_931_837_184);
	});

	it("counts fp4 experts declared via expert_dtype outside quantization_config (deepseek-ai/DeepSeek-V4-Pro)", async () => {
		// `quant_method: "fp8"` for attention, but `expert_dtype: "fp4"` for the experts, which are
		// packed two-per-byte in I8 and dominate the count. Previously reported 0.86T instead of 1.60T,
		// because the I8 experts got multiplier 1 and the F8_E8M0 block scales were counted as params.
		const parse = await parseSafetensorsMetadata({
			repo: "deepseek-ai/DeepSeek-V4-Pro",
			revision: "b5968e9190ef611bbf34a7229255be88a0e937c1",
			computeParametersCount: true,
		});

		assert(parse.sharded);
		assert.deepStrictEqual(parse.parameterCount, {
			BF16: 2_816_899_328,
			I64: 2_327_040,
			F32: 87_776_414,
			F8_E4M3: 23_169_335_296, // fp8 weights: one value per byte, no packing
			I8: 1_572_763_336_704, // 786_381_668_352 packed bytes x 2
		});
		assert.deepStrictEqual(sum(Object.values(parse.parameterCount)), 1_598_839_674_782);
		// the F8_E8M0 block scales (49_150_268_416) must not appear at all
		assert.strictEqual(parse.parameterCount["F8_E8M0"], undefined);
	});
});
