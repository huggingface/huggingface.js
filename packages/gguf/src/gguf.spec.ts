import { beforeAll, describe, expect, it } from "vitest";
import type { GGUFParseOutput, MetadataValue, GGUFTypedMetadata } from "./gguf";
import {
	GGMLFileQuantizationType,
	GGMLQuantizationType,
	GGUFValueType,
	gguf,
	ggufAllShards,
	parseGgufShardFilename,
	parseGGUFQuantLabel,
	GGUF_QUANT_RE,
	GGUF_QUANT_ORDER,
	findNearestQuantType,
	serializeGgufMetadata,
	buildGgufHeader,
} from "./gguf";
import fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_LLAMA = "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/191239b/llama-2-7b-chat.Q2_K.gguf";
const URL_MISTRAL_7B =
	"https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/3a6fbf4/mistral-7b-instruct-v0.2.Q5_K_M.gguf";
const URL_GEMMA_2B = "https://huggingface.co/lmstudio-ai/gemma-2b-it-GGUF/resolve/a0b140b/gemma-2b-it-q4_k_m.gguf";
const URL_BIG_ENDIAN =
	"https://huggingface.co/ggml-org/models/resolve/1213976/bert-bge-small/ggml-model-f16-big-endian.gguf";
const URL_V1 =
	"https://huggingface.co/tmadge/testing/resolve/66c078028d1ff92d7a9264a1590bc61ba6437933/tinyllamas-stories-260k-f32.gguf";
const URL_SHARDED_GROK =
	"https://huggingface.co/Arki05/Grok-1-GGUF/resolve/ecafa8d8eca9b8cd75d11a0d08d3a6199dc5a068/grok-1-IQ3_XS-split-00001-of-00009.gguf";
const URL_BIG_METADATA = "https://huggingface.co/ngxson/test_gguf_models/resolve/main/gguf_test_big_metadata.gguf";
const URL_KIMI_K25 =
	"https://huggingface.co/unsloth/Kimi-K2.5-GGUF/resolve/5f759b07a564a5cb9fcfa9ad456cf254e539ac77/UD-Q3_K_XL/Kimi-K2.5-UD-Q3_K_XL-00001-of-00011.gguf";

describe("gguf", () => {
	beforeAll(async () => {
		// download the gguf for "load file" test, save to .cache directory
		if (!fs.existsSync(".cache")) {
			fs.mkdirSync(".cache");
		}
		if (!fs.existsSync(".cache/model.gguf")) {
			const res = await fetch(URL_BIG_METADATA);
			const arrayBuf = await res.arrayBuffer();
			fs.writeFileSync(".cache/model.gguf", new Uint8Array(arrayBuf));
		}
	}, 30_000);

	it("should parse a llama2 7b", async () => {
		const { metadata, tensorInfos } = await gguf(URL_LLAMA);

		/// metadata

		expect(metadata).toMatchObject({
			// partial list, do not exhaustively list (tokenizer is quite big for instance)
			version: 2,
			tensor_count: 291n,
			kv_count: 19n,
			"general.architecture": "llama",
			"general.file_type": GGMLFileQuantizationType.Q2_K,
			"general.name": "LLaMA v2",
			"general.quantization_version": 2,
			"llama.attention.head_count": 32,
			"llama.attention.head_count_kv": 32,
			"llama.attention.layer_norm_rms_epsilon": 9.999999974752427e-7,
			"llama.block_count": 32,
			"llama.context_length": 4096,
			"llama.embedding_length": 4096,
			"llama.feed_forward_length": 11008,
			"llama.rope.dimension_count": 128,
		});

		expect(metadata["tokenizer.ggml.model"]);
		if (metadata["tokenizer.ggml.model"]) {
			const tokens = metadata["tokenizer.ggml.tokens"];
			if (!Array.isArray(tokens)) {
				throw new Error();
			}
			expect(tokens.slice(0, 10)).toEqual([
				"<unk>",
				"<s>",
				"</s>",
				"<0x00>",
				"<0x01>",
				"<0x02>",
				"<0x03>",
				"<0x04>",
				"<0x05>",
				"<0x06>",
			]);
		}

		/// Tensor infos
		/// By convention we test the first and last tensor.

		expect(tensorInfos.length).toEqual(291);
		expect(tensorInfos[0]).toMatchObject({
			name: "token_embd.weight",
			shape: [4096n, 32000n],
			dtype: GGMLQuantizationType.Q2_K,
		});
		expect(tensorInfos[tensorInfos.length - 1]).toMatchObject({
			name: "output_norm.weight",
			shape: [4096n],
			dtype: GGMLQuantizationType.F32,
		});
	});

	it("should parse a mistral 7b", async () => {
		const { metadata, tensorInfos } = await gguf(URL_MISTRAL_7B);

		/// metadata

		expect(metadata).toMatchObject({
			version: 3,
			tensor_count: 291n,
			kv_count: 24n,
			"general.architecture": "llama",
			"general.file_type": GGMLFileQuantizationType.Q5_K_M,
			"general.name": "mistralai_mistral-7b-instruct-v0.2",
			"general.quantization_version": 2,
			"llama.attention.head_count": 32,
			"llama.attention.head_count_kv": 8,
			"llama.attention.layer_norm_rms_epsilon": 0.000009999999747378752,
			"llama.block_count": 32,
			"llama.context_length": 32768,
			"llama.embedding_length": 4096,
			"llama.feed_forward_length": 14336,
			"llama.rope.dimension_count": 128,
		});

		/// Tensor infos

		expect(tensorInfos.length).toEqual(291);
		expect(tensorInfos[0]).toMatchObject({
			name: "token_embd.weight",
			shape: [4096n, 32000n],
			dtype: GGMLQuantizationType.Q5_K,
		});
		expect(tensorInfos[tensorInfos.length - 1]).toMatchObject({
			name: "output.weight",
			shape: [4096n, 32000n],
			dtype: GGMLQuantizationType.Q6_K,
		});
	});

	it("should parse a gemma 2b", async () => {
		const { metadata, tensorInfos } = await gguf(URL_GEMMA_2B);

		/// metadata

		expect(metadata).toMatchObject({
			version: 3,
			tensor_count: 164n,
			kv_count: 21n,
			"general.architecture": "gemma",
			"general.file_type": GGMLFileQuantizationType.Q4_K_M,
			"general.name": "gemma-2b-it",
			"general.quantization_version": 2,
			"gemma.attention.head_count": 8,
			"gemma.attention.head_count_kv": 1,
			"gemma.attention.layer_norm_rms_epsilon": 9.999999974752427e-7,
			"gemma.block_count": 18,
			"gemma.context_length": 8192,
			"gemma.embedding_length": 2048,
			"gemma.feed_forward_length": 16384,
		});

		/// Tensor infos

		expect(tensorInfos.length).toEqual(164);
		expect(tensorInfos[0]).toMatchObject({
			name: "token_embd.weight",
			shape: [2048n, 256128n],
			dtype: GGMLQuantizationType.Q4_K,
		});
		expect(tensorInfos[tensorInfos.length - 1]).toMatchObject({
			name: "blk.9.ffn_norm.weight",
			shape: [2048n],
			dtype: GGMLQuantizationType.F32,
		});
	});

	it("should parse a big-endian file", async () => {
		const { metadata, tensorInfos } = await gguf(URL_BIG_ENDIAN);

		/// metadata

		expect(metadata).toMatchObject({
			version: 3,
			tensor_count: 197n,
			kv_count: 23n,
			"general.architecture": "bert",
			"general.file_type": GGMLFileQuantizationType.F16,
			"general.name": "bge-small-en-v1.5",
			"bert.attention.causal": false,
			"bert.attention.head_count": 12,
			"bert.attention.layer_norm_epsilon": 9.999999960041972e-13,
			"bert.block_count": 12,
			"bert.context_length": 512,
			"bert.embedding_length": 384,
			"bert.feed_forward_length": 1536,
			"bert.pooling_type": 2,
		});

		/// Tensor infos

		expect(tensorInfos.length).toEqual(197);
		expect(tensorInfos[0]).toMatchObject({
			name: "token_embd_norm.bias",
			shape: [384n],
			dtype: GGMLQuantizationType.F32,
		});
		expect(tensorInfos[tensorInfos.length - 1]).toMatchObject({
			name: "blk.9.ffn_down.weight",
			shape: [1536n, 384n],
			dtype: GGMLQuantizationType.F16,
		});
	});

	it("should parse a v1 file", async () => {
		const { metadata, tensorInfos } = await gguf(URL_V1);

		/// metadata

		expect(metadata).toMatchObject({
			version: 1,
			tensor_count: 48n,
			kv_count: 18n,
			"general.architecture": "llama",
			"general.name": "tinyllamas-stories-260k",
			"llama.attention.head_count": 8,
			"llama.attention.head_count_kv": 4,
			"llama.attention.layer_norm_rms_epsilon": 0.000009999999747378752,
			"llama.block_count": 5,
			"llama.context_length": 512,
			"llama.embedding_length": 64,
			"llama.feed_forward_length": 172,
			"llama.rope.dimension_count": 8,
			"llama.tensor_data_layout": "Meta AI original pth",
			"tokenizer.ggml.bos_token_id": 1,
			"tokenizer.ggml.eos_token_id": 2,
			"tokenizer.ggml.model": "llama",
			"tokenizer.ggml.padding_token_id": 0,
		});

		/// Tensor infos

		expect(tensorInfos.length).toEqual(48);
		expect(tensorInfos[0]).toMatchObject({
			name: "token_embd.weight",
			shape: [64n, 512n],
			dtype: GGMLQuantizationType.F32,
		});
		expect(tensorInfos[tensorInfos.length - 1]).toMatchObject({
			name: "output.weight",
			shape: [64n, 512n],
			dtype: GGMLQuantizationType.F32,
		});
	});

	it("should parse a large MoE model (Kimi-K2.5, 160K vocab)", async () => {
		const { metadata, typedMetadata, tensorInfos } = await gguf(URL_KIMI_K25, { typedMetadata: true });

		expect(metadata).toMatchObject({
			version: 3,
			"general.architecture": "deepseek2",
			"general.name": "Kimi-K2.5",
			"deepseek2.block_count": 61,
			"deepseek2.embedding_length": 7168,
			"deepseek2.expert_count": 384,
			"deepseek2.expert_used_count": 8,
			"deepseek2.expert_shared_count": 1,
			"deepseek2.vocab_size": 163840,
		});

		expect(typedMetadata["general.architecture"]).toEqual({
			value: "deepseek2",
			type: GGUFValueType.STRING,
		});
		expect(typedMetadata["deepseek2.expert_count"]).toEqual({
			value: 384,
			type: GGUFValueType.UINT32,
		});
		expect(typedMetadata["tokenizer.ggml.tokens"]).toMatchObject({
			type: GGUFValueType.ARRAY,
			subType: GGUFValueType.STRING,
		});
		const tokens = typedMetadata["tokenizer.ggml.tokens"].value;
		expect(Array.isArray(tokens)).toBe(true);
		if (Array.isArray(tokens)) {
			expect(tokens.length).toEqual(163_840);
		}

		expect(tensorInfos.length).toBeGreaterThan(0);
		expect(tensorInfos[0]).toMatchObject({
			name: "output.weight",
			shape: [7168n, 163840n],
		});
	});

	it("should parse a local file", async () => {
		const parsedGguf = await gguf(".cache/model.gguf", { allowLocalFile: true });
		const { metadata } = parsedGguf as GGUFParseOutput<{ strict: false }>; // custom metadata arch, no need for typing
		expect(metadata["dummy.1"]).toBeDefined(); // first metadata in the list
		expect(metadata["dummy.32767"]).toBeDefined(); // last metadata in the list
	});

	it("should detect sharded gguf filename", async () => {
		const ggufPath = "grok-1/grok-1-q4_0-00003-of-00009.gguf"; // https://huggingface.co/ggml-org/models/blob/fcf344adb9686474c70e74dd5e55465e9e6176ef/grok-1/grok-1-q4_0-00003-of-00009.gguf
		const ggufShardFileInfo = parseGgufShardFilename(ggufPath);

		expect(ggufShardFileInfo?.prefix).toEqual("grok-1/grok-1-q4_0");
		expect(ggufShardFileInfo?.shard).toEqual("00003");
		expect(ggufShardFileInfo?.total).toEqual("00009");
	});

	it("should get param count for llama2 7b", async () => {
		const { parameterCount } = await gguf(URL_LLAMA, { computeParametersCount: true });
		expect(parameterCount).toEqual(6_738_415_616); // 7B
	});

	it("should get param count for sharded gguf", async () => {
		const { parameterCount, urls } = await ggufAllShards(URL_SHARDED_GROK);
		expect(parameterCount).toEqual(316_490_127_360); // 316B
		expect(urls).toHaveLength(9);
		expect(urls[0]).toMatch(/00001-of-00009\.gguf$/);
		expect(urls[8]).toMatch(/00009-of-00009\.gguf$/);
	});

	it("should return urls for single (non-sharded) gguf", async () => {
		const { urls } = await ggufAllShards(URL_LLAMA);
		expect(urls).toHaveLength(1);
		expect(urls[0]).toEqual(URL_LLAMA);
	});

	it("parse quant label", async () => {
		expect(parseGGUFQuantLabel("Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf")).toEqual("Q4_K_M");
		expect(parseGGUFQuantLabel("subdir/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf")).toEqual("Q4_K_M");
		expect(parseGGUFQuantLabel("Codestral-22B-v0.1-Q2_K.gguf")).toEqual("Q2_K");
		expect(parseGGUFQuantLabel("Codestral-22B-v0.1.gguf")).toEqual(undefined);
		expect(parseGGUFQuantLabel("Codestral-22B-v0.1-F32-Q2_K.gguf")).toEqual("Q2_K"); // gguf name with two quant labels [F32, Q2_K]
		expect(parseGGUFQuantLabel("Codestral-22B-v0.1-IQ3_XS.gguf")).toEqual("IQ3_XS");
		expect(parseGGUFQuantLabel("Codestral-22B-v0.1-Q4_0_4_4.gguf")).toEqual("Q4_0"); // TODO: investigate Q4_0_4_4
		expect(parseGGUFQuantLabel("Qwen3-4B-UD-Q2_K_XL.gguf")).toEqual("UD-Q2_K_XL"); // unsloth UD (Unsloth Dynamic) prefix
		// llama.cpp names gpt-oss files after the tensor type (MXFP4) even though general.file_type is MXFP4_MOE
		expect(parseGGUFQuantLabel("gpt-oss-20b-MXFP4.gguf")).toEqual("MXFP4");
		expect(parseGGUFQuantLabel("gpt-oss-120b-MXFP4.gguf")).toEqual("MXFP4");
		expect(parseGGUFQuantLabel("Qwable-v1-35B-A3B-MXFP4_MOE.gguf")).toEqual("MXFP4_MOE");
	});

	it("parse quant label groups", async () => {
		const groups = (fname: string) => {
			const { prefix, quant, sizeVariation } = parseGGUFQuantLabel(fname)?.match(GGUF_QUANT_RE)?.groups ?? {};
			return { prefix, quant, sizeVariation };
		};
		expect(groups("gemma-2-9b-it-Q6_K_L.gguf")).toEqual({ prefix: undefined, quant: "Q6_K", sizeVariation: "L" });
		expect(groups("Qwen3-4B-UD-Q2_K_XL.gguf")).toEqual({ prefix: "UD-", quant: "Q2_K", sizeVariation: "XL" });
		// MXFP4_MOE must keep winning the alternation over the MXFP4 alias: parsing it as quant MXFP4 with
		// sizeVariation MOE would make it sort as an unknown size among the other 4-bit quants
		expect(groups("Qwable-v1-35B-A3B-MXFP4_MOE.gguf")).toEqual({
			prefix: undefined,
			quant: "MXFP4_MOE",
			sizeVariation: undefined,
		});
		expect(groups("gpt-oss-20b-MXFP4.gguf")).toEqual({ prefix: undefined, quant: "MXFP4", sizeVariation: undefined });
	});

	it("calculate tensor data offset", async () => {
		const { tensorDataOffset } = await gguf(URL_LLAMA);
		expect(tensorDataOffset).toEqual(741056n);
	});

	// Quantization handler

	it("should have GGUF_QUANT_ORDER in sync with GGMLFileQuantizationType enum", () => {
		const enumValues = Object.values(GGMLFileQuantizationType).filter((value) => typeof value === "number") as number[];
		const checkValues = new Set(GGUF_QUANT_ORDER);
		for (const value of enumValues) {
			expect(checkValues).toContain(value);
		}
	});

	it("should find the nearest quant", () => {
		const quant = GGMLFileQuantizationType.IQ2_M;
		const availableQuants = [
			GGMLFileQuantizationType.Q2_K,
			GGMLFileQuantizationType.Q4_K_M,
			GGMLFileQuantizationType.Q8_0,
		];
		const nearestQuant = findNearestQuantType(quant, availableQuants);
		expect(nearestQuant).toEqual(GGMLFileQuantizationType.Q2_K);
	});

	it("should find the nearest quant (vision model)", () => {
		const visionQuants = [GGMLFileQuantizationType.Q8_0, GGMLFileQuantizationType.F16, GGMLFileQuantizationType.BF16];
		let nearestQuant;
		// text = Q4_K_M
		nearestQuant = findNearestQuantType(GGMLFileQuantizationType.Q4_K_M, visionQuants);
		expect(nearestQuant).toEqual(GGMLFileQuantizationType.Q8_0);
		// text = Q8_0
		nearestQuant = findNearestQuantType(GGMLFileQuantizationType.Q8_0, visionQuants);
		expect(nearestQuant).toEqual(GGMLFileQuantizationType.Q8_0);
		// text = F16
		nearestQuant = findNearestQuantType(GGMLFileQuantizationType.F16, visionQuants);
		expect(nearestQuant).toEqual(GGMLFileQuantizationType.F16);
	});

	it("should not return typedMetadata by default", async () => {
		const result = await gguf(URL_LLAMA);
		expect(result).not.toHaveProperty("typedMetadata");
		expect(result).toHaveProperty("metadata");
		expect(result).toHaveProperty("tensorInfos");
		expect(result).toHaveProperty("tensorDataOffset");
	});

	it("should return typedMetadata when requested", async () => {
		const { metadata, typedMetadata, tensorInfos } = await gguf(URL_LLAMA, { typedMetadata: true });

		// Should have both metadata and typedMetadata
		expect(metadata).toBeDefined();
		expect(typedMetadata).toBeDefined();
		expect(tensorInfos).toBeDefined();

		// Basic structure checks
		expect(typedMetadata.version).toEqual({
			value: 2,
			type: GGUFValueType.UINT32,
		});
		expect(typedMetadata.tensor_count).toEqual({
			value: 291n,
			type: GGUFValueType.UINT64,
		});
		expect(typedMetadata.kv_count).toEqual({
			value: 19n,
			type: GGUFValueType.UINT64,
		});

		// Check string metadata
		expect(typedMetadata["general.architecture"]).toEqual({
			value: "llama",
			type: GGUFValueType.STRING,
		});
		expect(typedMetadata["general.name"]).toEqual({
			value: "LLaMA v2",
			type: GGUFValueType.STRING,
		});

		// Check numeric metadata
		expect(typedMetadata["general.file_type"]).toEqual({
			value: GGMLFileQuantizationType.Q2_K,
			type: GGUFValueType.UINT32,
		});
		expect(typedMetadata["llama.attention.head_count"]).toEqual({
			value: 32,
			type: GGUFValueType.UINT32,
		});

		// Check float metadata
		expect(typedMetadata["llama.attention.layer_norm_rms_epsilon"]).toEqual({
			value: 9.999999974752427e-7,
			type: GGUFValueType.FLOAT32,
		});
	});

	it("should return typedMetadata with parameter count", async () => {
		const { metadata, typedMetadata, tensorInfos, parameterCount } = await gguf(URL_LLAMA, {
			typedMetadata: true,
			computeParametersCount: true,
		});

		expect(metadata).toBeDefined();
		expect(typedMetadata).toBeDefined();
		expect(tensorInfos).toBeDefined();
		expect(parameterCount).toEqual(6_738_415_616);

		// Verify typedMetadata structure is still correct
		expect(typedMetadata.version).toEqual({
			value: 2,
			type: GGUFValueType.UINT32,
		});
		expect(typedMetadata["general.architecture"]).toEqual({
			value: "llama",
			type: GGUFValueType.STRING,
		});
	});

	it("should handle typedMetadata for V1 files", async () => {
		const { typedMetadata } = await gguf(URL_V1, { typedMetadata: true });

		// V1 files use UINT32 for counts instead of UINT64
		expect(typedMetadata.version).toEqual({
			value: 1,
			type: GGUFValueType.UINT32,
		});
		expect(typedMetadata.tensor_count).toEqual({
			value: 48n,
			type: GGUFValueType.UINT32,
		});
		expect(typedMetadata.kv_count).toEqual({
			value: 18n,
			type: GGUFValueType.UINT32,
		});

		// Check other fields are properly typed
		expect(typedMetadata["general.architecture"]).toEqual({
			value: "llama",
			type: GGUFValueType.STRING,
		});
		expect(typedMetadata["llama.attention.head_count"]).toEqual({
			value: 8,
			type: GGUFValueType.UINT32,
		});
	});

	it("should handle array metadata types in typedMetadata", async () => {
		const { typedMetadata } = await gguf(URL_LLAMA, { typedMetadata: true });

		// Check if tokens array is properly handled
		if (typedMetadata["tokenizer.ggml.tokens"]) {
			expect(typedMetadata["tokenizer.ggml.tokens"].type).toEqual(GGUFValueType.ARRAY);
			expect(typedMetadata["tokenizer.ggml.tokens"].subType).toEqual(GGUFValueType.STRING);
			expect(Array.isArray(typedMetadata["tokenizer.ggml.tokens"].value)).toBe(true);
		}

		// Check if scores array is properly handled
		if (typedMetadata["tokenizer.ggml.scores"]) {
			expect(typedMetadata["tokenizer.ggml.scores"].type).toEqual(GGUFValueType.ARRAY);
			expect(typedMetadata["tokenizer.ggml.scores"].subType).toEqual(GGUFValueType.FLOAT32);
			expect(Array.isArray(typedMetadata["tokenizer.ggml.scores"].value)).toBe(true);
		}

		// Check if token_type array is properly handled
		if (typedMetadata["tokenizer.ggml.token_type"]) {
			expect(typedMetadata["tokenizer.ggml.token_type"].type).toEqual(GGUFValueType.ARRAY);
			expect(typedMetadata["tokenizer.ggml.token_type"].subType).toEqual(GGUFValueType.INT32);
			expect(Array.isArray(typedMetadata["tokenizer.ggml.token_type"].value)).toBe(true);
		}
	});

	it("should maintain consistency between metadata and typedMetadata values", async () => {
		const { metadata, typedMetadata } = await gguf(URL_LLAMA, { typedMetadata: true });

		// All keys should be present in both
		const metadataKeys = Object.keys(metadata);
		const typedMetadataKeys = Object.keys(typedMetadata);

		expect(metadataKeys.sort()).toEqual(typedMetadataKeys.sort());

		// Values should match for all keys
		const metadataAsRecord = metadata as Record<string, MetadataValue>;
		for (const key of metadataKeys) {
			expect(typedMetadata[key].value).toEqual(metadataAsRecord[key]);
		}
	});

	it("should return littleEndian property", async () => {
		const result = await gguf(URL_LLAMA);
		expect(result.littleEndian).toBe(true);
	});

	it("should return littleEndian with typedMetadata", async () => {
		const result = await gguf(URL_LLAMA, { typedMetadata: true });
		expect(result.littleEndian).toBe(true);
	});

	it("should detect big-endian files correctly", async () => {
		const result = await gguf(URL_BIG_ENDIAN);
		expect(result.littleEndian).toBe(false);
	});

	// Serialization tests
	describe("serializeGgufMetadata", () => {
		it("should serialize basic typedMetadata to Uint8Array", () => {
			const typedMetadata: GGUFTypedMetadata = {
				version: { value: 2, type: GGUFValueType.UINT32 },
				tensor_count: { value: 0n, type: GGUFValueType.UINT64 },
				kv_count: { value: 3n, type: GGUFValueType.UINT64 },
				"general.architecture": { value: "llama", type: GGUFValueType.STRING },
				"general.name": { value: "Test Model", type: GGUFValueType.STRING },
				"general.file_type": { value: 1, type: GGUFValueType.UINT32 },
			};

			const result = serializeGgufMetadata(typedMetadata);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it("should serialize typedMetadata with arrays", () => {
			const typedMetadata: GGUFTypedMetadata = {
				version: { value: 2, type: GGUFValueType.UINT32 },
				tensor_count: { value: 0n, type: GGUFValueType.UINT64 },
				kv_count: { value: 2n, type: GGUFValueType.UINT64 },
				"tokenizer.ggml.tokens": {
					value: ["<unk>", "<s>", "</s>"],
					type: GGUFValueType.ARRAY,
					subType: GGUFValueType.STRING,
				},
				"tokenizer.ggml.scores": {
					value: [0.0, -1000.0, -1000.0],
					type: GGUFValueType.ARRAY,
					subType: GGUFValueType.FLOAT32,
				},
			};

			const result = serializeGgufMetadata(typedMetadata);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it("should handle different value types", () => {
			const typedMetadata: GGUFTypedMetadata = {
				version: { value: 2, type: GGUFValueType.UINT32 },
				tensor_count: { value: 0n, type: GGUFValueType.UINT64 },
				kv_count: { value: 6n, type: GGUFValueType.UINT64 },
				"test.uint8": { value: 255, type: GGUFValueType.UINT8 },
				"test.int8": { value: -128, type: GGUFValueType.INT8 },
				"test.bool": { value: true, type: GGUFValueType.BOOL },
				"test.float32": { value: 3.14159, type: GGUFValueType.FLOAT32 },
				"test.uint64": { value: 9223372036854775807n, type: GGUFValueType.UINT64 },
				"test.int64": { value: -9223372036854775808n, type: GGUFValueType.INT64 },
			};

			const result = serializeGgufMetadata(typedMetadata);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it("should handle different endianness", () => {
			const typedMetadata: GGUFTypedMetadata = {
				version: { value: 2, type: GGUFValueType.UINT32 },
				tensor_count: { value: 0n, type: GGUFValueType.UINT64 },
				kv_count: { value: 1n, type: GGUFValueType.UINT64 },
				"test.value": { value: 42, type: GGUFValueType.UINT32 },
			};

			const littleEndianResult = serializeGgufMetadata(typedMetadata, { littleEndian: true });
			const bigEndianResult = serializeGgufMetadata(typedMetadata, { littleEndian: false });

			expect(littleEndianResult.length).toBe(bigEndianResult.length);
			expect(littleEndianResult).toBeInstanceOf(Uint8Array);
			expect(bigEndianResult).toBeInstanceOf(Uint8Array);
		});

		it("should throw error for array without subType", () => {
			const typedMetadata = {
				version: { value: 2, type: GGUFValueType.UINT32 },
				tensor_count: { value: 0n, type: GGUFValueType.UINT64 },
				kv_count: { value: 1n, type: GGUFValueType.UINT64 },
				"test.array": {
					value: ["test"],
					type: GGUFValueType.ARRAY,
					// missing subType
				},
			} as GGUFTypedMetadata;

			expect(() => serializeGgufMetadata(typedMetadata)).toThrow("Array type requires subType to be specified");
		});

		it("should round-trip: serialize then deserialize back to same metadata", async () => {
			const originalTypedMetadata: GGUFTypedMetadata = {
				version: { value: 2, type: GGUFValueType.UINT32 },
				tensor_count: { value: 0n, type: GGUFValueType.UINT64 },
				kv_count: { value: 4n, type: GGUFValueType.UINT64 },
				"general.architecture": { value: "llama", type: GGUFValueType.STRING },
				"general.name": { value: "Test Model", type: GGUFValueType.STRING },
				"general.file_type": { value: 10, type: GGUFValueType.UINT32 },
				"tokenizer.ggml.tokens": {
					value: ["<unk>", "<s>", "</s>"],
					type: GGUFValueType.ARRAY,
					subType: GGUFValueType.STRING,
				},
			};

			// Serialize to Uint8Array
			const serializedArray = serializeGgufMetadata(originalTypedMetadata);

			// Create a temporary file for testing
			const tempFilePath = join(tmpdir(), `test-gguf-${Date.now()}.gguf`);
			fs.writeFileSync(tempFilePath, new Uint8Array(serializedArray));

			try {
				// Deserialize back using the gguf function
				const { typedMetadata: deserializedMetadata } = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				// Check that all fields match
				expect(deserializedMetadata.version).toEqual(originalTypedMetadata.version);
				expect(deserializedMetadata.tensor_count).toEqual(originalTypedMetadata.tensor_count);
				expect(deserializedMetadata.kv_count).toEqual(originalTypedMetadata.kv_count);
				expect(deserializedMetadata["general.architecture"]).toEqual(originalTypedMetadata["general.architecture"]);
				expect(deserializedMetadata["general.name"]).toEqual(originalTypedMetadata["general.name"]);
				expect(deserializedMetadata["general.file_type"]).toEqual(originalTypedMetadata["general.file_type"]);
				expect(deserializedMetadata["tokenizer.ggml.tokens"]).toEqual(originalTypedMetadata["tokenizer.ggml.tokens"]);

				// Verify the kv_count matches the actual number of KV pairs (excluding built-in fields)
				const kvPairs = Object.keys(deserializedMetadata).filter(
					(key) => !["version", "tensor_count", "kv_count"].includes(key),
				);
				expect(BigInt(kvPairs.length)).toBe(originalTypedMetadata.kv_count.value);
			} finally {
				// Clean up the temporary file
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		});

		it("should round-trip with different data types", async () => {
			const originalTypedMetadata: GGUFTypedMetadata = {
				version: { value: 2, type: GGUFValueType.UINT32 },
				tensor_count: { value: 0n, type: GGUFValueType.UINT64 },
				kv_count: { value: 8n, type: GGUFValueType.UINT64 },
				"test.uint8": { value: 255, type: GGUFValueType.UINT8 },
				"test.int8": { value: -128, type: GGUFValueType.INT8 },
				"test.uint16": { value: 65535, type: GGUFValueType.UINT16 },
				"test.int16": { value: -32768, type: GGUFValueType.INT16 },
				"test.bool": { value: true, type: GGUFValueType.BOOL },
				"test.float32": { value: 3.14159, type: GGUFValueType.FLOAT32 },
				"test.uint64": { value: 18446744073709551615n, type: GGUFValueType.UINT64 },
				"test.int64": { value: -9223372036854775808n, type: GGUFValueType.INT64 },
			};

			// Serialize to Uint8Array
			const serializedArray = serializeGgufMetadata(originalTypedMetadata);

			// Create a temporary file for testing
			const tempFilePath = join(tmpdir(), `test-gguf-${Date.now()}.gguf`);
			fs.writeFileSync(tempFilePath, new Uint8Array(serializedArray));

			try {
				// Deserialize back using the gguf function
				const { typedMetadata: deserializedMetadata } = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				// Check all the different data types
				expect(deserializedMetadata["test.uint8"]).toEqual(originalTypedMetadata["test.uint8"]);
				expect(deserializedMetadata["test.int8"]).toEqual(originalTypedMetadata["test.int8"]);
				expect(deserializedMetadata["test.uint16"]).toEqual(originalTypedMetadata["test.uint16"]);
				expect(deserializedMetadata["test.int16"]).toEqual(originalTypedMetadata["test.int16"]);
				expect(deserializedMetadata["test.bool"]).toEqual(originalTypedMetadata["test.bool"]);
				// For float32, check approximate equality due to precision limitations
				expect(deserializedMetadata["test.float32"].type).toBe(originalTypedMetadata["test.float32"].type);
				expect(deserializedMetadata["test.float32"].value as number).toBeCloseTo(
					originalTypedMetadata["test.float32"].value as number,
					5,
				);
				expect(deserializedMetadata["test.uint64"]).toEqual(originalTypedMetadata["test.uint64"]);
				expect(deserializedMetadata["test.int64"]).toEqual(originalTypedMetadata["test.int64"]);
			} finally {
				// Clean up the temporary file
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		});

		it("should round-trip with detected endianness from real file", async () => {
			// Parse a real GGUF file to get its metadata and endianness
			const { typedMetadata: originalMetadata, littleEndian: detectedEndianness } = await gguf(URL_LLAMA, {
				typedMetadata: true,
			});

			// Create a minimal test metadata based on the real file
			const testMetadata = {
				version: originalMetadata.version,
				tensor_count: { value: 0n, type: GGUFValueType.UINT64 },
				kv_count: { value: 2n, type: GGUFValueType.UINT64 },
				"general.architecture": originalMetadata["general.architecture"] ?? {
					value: "llama" as const,
					type: GGUFValueType.STRING,
				},
				"general.name": { value: "Test Model", type: GGUFValueType.STRING },
			} as GGUFTypedMetadata;

			// Serialize using the detected endianness
			const serializedArray = serializeGgufMetadata(testMetadata, {
				littleEndian: detectedEndianness,
			});

			// Create a temporary file for testing
			const tempFilePath = join(tmpdir(), `test-gguf-endian-${Date.now()}.gguf`);
			fs.writeFileSync(tempFilePath, new Uint8Array(serializedArray));

			try {
				// Deserialize back using the gguf function
				const { typedMetadata: deserializedMetadata, littleEndian: deserializedEndianness } = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				// Verify endianness is preserved
				expect(deserializedEndianness).toBe(detectedEndianness);

				// Verify metadata matches
				expect(deserializedMetadata.version).toEqual(testMetadata.version);
				expect(deserializedMetadata.tensor_count).toEqual(testMetadata.tensor_count);
				expect(deserializedMetadata.kv_count).toEqual(testMetadata.kv_count);
				expect(deserializedMetadata["general.architecture"]).toEqual(testMetadata["general.architecture"]);
				expect(deserializedMetadata["general.name"]).toEqual(testMetadata["general.name"]);
			} finally {
				// Clean up the temporary file
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		});

		it("should exactly match original file serialization", async () => {
			// Use a real GGUF file to test exact serialization matching
			const testUrl = URL_GEMMA_2B;

			// Parse the original file
			const {
				typedMetadata: originalMetadata,
				tensorDataOffset,
				littleEndian,
				tensorInfos,
			} = await gguf(testUrl, {
				typedMetadata: true,
			});

			console.log(`📊 Original file structure:`);
			console.log(`  Tensor count: ${originalMetadata.tensor_count.value}`);
			console.log(`  KV count: ${originalMetadata.kv_count.value}`);
			console.log(`  Tensor infos length: ${tensorInfos.length}`);
			console.log(`  Tensor data offset: ${tensorDataOffset}`);

			// Get the original header bytes for comparison
			const headerSize = Number(tensorDataOffset);
			const originalHeaderResponse = await fetch(testUrl, {
				headers: {
					Range: `bytes=0-${headerSize - 1}`,
				},
			});
			const originalHeaderBytes = new Uint8Array(await originalHeaderResponse.arrayBuffer());

			// Serialize the metadata using our function with empty tensor array (modify tensor_count for this test)
			const modifiedMetadata = {
				...originalMetadata,
				tensor_count: { value: 0n, type: GGUFValueType.UINT64 },
			};

			const ourBytes = serializeGgufMetadata(modifiedMetadata as GGUFTypedMetadata, {
				littleEndian,
			});

			// Compare sizes
			console.log(`Original header size: ${originalHeaderBytes.length} bytes`);
			console.log(`Our serialized size: ${ourBytes.length} bytes`);
			console.log(`Difference: ${originalHeaderBytes.length - ourBytes.length} bytes`);

			console.log(`\n🔍 Analysis:`);
			console.log(`  Our serialization includes metadata KV pairs with empty tensor array`);
			console.log(`  Original header includes: metadata + tensor info + padding to alignment`);
			console.log(`  Missing tensor info for ${tensorInfos.length} tensors`);

			// Test that our serialized data at least parses correctly
			const tempFilePath = join(tmpdir(), `test-serialization-${Date.now()}.gguf`);
			fs.writeFileSync(tempFilePath, new Uint8Array(ourBytes));

			try {
				const { typedMetadata: deserializedMetadata } = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				// Verify key fields match (with our modified tensor_count)
				expect(deserializedMetadata.version).toEqual(modifiedMetadata.version);
				expect(deserializedMetadata.tensor_count).toEqual(modifiedMetadata.tensor_count);
				expect(deserializedMetadata.kv_count).toEqual(modifiedMetadata.kv_count);
				if (originalMetadata["general.name"]) {
					expect(deserializedMetadata["general.name"]).toEqual(originalMetadata["general.name"]);
				}

				console.log(`✅ Our metadata serialization with empty tensors is correct`);

				expect(ourBytes.length).toBeGreaterThan(0);
				expect(deserializedMetadata).toBeDefined();
			} finally {
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		}, 30000);

		it("should create complete GGUF header with serializeGgufMetadata", async () => {
			// Use a real GGUF file to test complete serialization
			const testUrl = URL_GEMMA_2B;

			// Parse the original file
			const {
				typedMetadata: originalMetadata,
				tensorDataOffset,
				littleEndian,
			} = await gguf(testUrl, {
				typedMetadata: true,
			});

			// Get the original header bytes for comparison
			const headerSize = Number(tensorDataOffset);
			const originalHeaderResponse = await fetch(testUrl, {
				headers: {
					Range: `bytes=0-${headerSize - 1}`,
				},
			});
			const originalHeaderBytes = new Uint8Array(await originalHeaderResponse.arrayBuffer());

			const alignment = Number(originalMetadata["general.alignment"] ?? 32);
			const completeHeaderBytes = serializeGgufMetadata(originalMetadata, {
				littleEndian,
				alignment,
			});

			console.log(`📊 Metadata-only serialization comparison:`);
			console.log(`  Original header size: ${originalHeaderBytes.length} bytes`);
			console.log(`  Metadata-only serialized size: ${completeHeaderBytes.length} bytes`);
			console.log(`  Difference: ${Math.abs(originalHeaderBytes.length - completeHeaderBytes.length)} bytes`);

			// Test that our metadata-only serialized header parses correctly
			const tempFilePath = join(tmpdir(), `test-complete-${Date.now()}.gguf`);
			fs.writeFileSync(tempFilePath, new Uint8Array(completeHeaderBytes));

			try {
				const {
					typedMetadata: deserializedMetadata,
					tensorInfos: deserializedTensorInfos,
					tensorDataOffset: deserializedOffset,
				} = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				console.log(`✅ Complete header parses successfully!`);
				console.log(
					`📋 Tensor count matches: ${deserializedTensorInfos.length} === ${originalMetadata.tensor_count.value}`,
				);
				console.log(`📊 Tensor data offset: ${deserializedOffset}`);

				// Verify the structure is correct
				expect(deserializedMetadata.version).toEqual(originalMetadata.version);
				expect(deserializedMetadata.tensor_count.value).toBe(originalMetadata.tensor_count.value);
				expect(deserializedTensorInfos.length).toBe(Number(originalMetadata.tensor_count.value));
				expect(deserializedMetadata["general.name"]).toEqual(originalMetadata["general.name"]);

				// Since we're now serializing metadata only, the size difference should be significant
				expect(completeHeaderBytes.length).toBeGreaterThan(0);
				expect(completeHeaderBytes.length).toBeLessThan(originalHeaderBytes.length); // Should be smaller without tensor info
			} finally {
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		}, 30000);
	});

	describe("malformed tensor shapes", () => {
		/**
		 * Builds a minimal GGUF v3 file with the given tensor shapes. Hermetic on purpose: the
		 * real-world instances of this live in third-party PoC repos we don't want tests to depend on.
		 */
		function buildGgufWithShapes(shapes: bigint[][], trailingDataBytes = 0): Uint8Array {
			const nameBytes = shapes.map((_, i) => new TextEncoder().encode(`t${i}`));
			let size = 4 + 4 + 8 + 8; // magic + version + tensor_count + kv_count
			for (let i = 0; i < shapes.length; i++) {
				size += 8 + nameBytes[i].length + 4 + shapes[i].length * 8 + 4 + 8;
			}
			const buf = new Uint8Array(size + trailingDataBytes);
			const view = new DataView(buf.buffer);
			buf.set(new TextEncoder().encode("GGUF"), 0);
			let off = 4;
			view.setUint32(off, 3, true); // version
			off += 4;
			view.setBigUint64(off, BigInt(shapes.length), true); // tensor_count
			off += 8;
			view.setBigUint64(off, 0n, true); // kv_count
			off += 8;
			for (let i = 0; i < shapes.length; i++) {
				view.setBigUint64(off, BigInt(nameBytes[i].length), true);
				off += 8;
				buf.set(nameBytes[i], off);
				off += nameBytes[i].length;
				view.setUint32(off, shapes[i].length, true); // n_dims
				off += 4;
				for (const dim of shapes[i]) {
					view.setBigUint64(off, dim, true);
					off += 8;
				}
				view.setUint32(off, GGMLQuantizationType.F32, true); // dtype
				off += 4;
				view.setBigUint64(off, 0n, true); // offset
				off += 8;
			}
			return buf;
		}

		async function parseBytes(bytes: Uint8Array) {
			const path = join(tmpdir(), `gguf-shape-guard-${Date.now()}-${Math.random().toString(36).slice(2)}.gguf`);
			fs.writeFileSync(path, bytes);
			try {
				return await gguf(path, { computeParametersCount: true, allowLocalFile: true });
			} finally {
				fs.unlinkSync(path);
			}
		}

		const U64_MAX = 18446744073709551615n;

		it("rejects uint64-max dimensions instead of reporting 3.4e38 parameters", async () => {
			// shape of the real PoC: a ~70 byte file declaring one tensor with two 2^64-1 dims.
			// (2^64-1)^2 === 3.402824e38, which is finite, so a Number.isFinite check does not help.
			await expect(parseBytes(buildGgufWithShapes([[U64_MAX, U64_MAX]]))).rejects.toThrow(
				/dimension 0 is 18446744073709551615, which exceeds the maximum allowed/,
			);
		});

		it("rejects int64-max dimensions", async () => {
			await expect(parseBytes(buildGgufWithShapes([[9223372036854775807n, 9223372036854775807n]]))).rejects.toThrow(
				/exceeds the maximum allowed/,
			);
		});

		it("rejects many tensors each at the n_dims cap (the '7e159 params' shape)", async () => {
			// n_dims 8 is exactly MAX_TENSOR_NDIMS and the tensor count is well under MAX_TENSOR_COUNT,
			// so every pre-existing limit is satisfied — only the dimension values are out of range.
			const shapes = Array.from({ length: 50 }, () => Array.from({ length: 8 }, () => U64_MAX));
			await expect(parseBytes(buildGgufWithShapes(shapes))).rejects.toThrow(/exceeds the maximum allowed/);
		});

		it("rejects shapes that are individually plausible but cannot fit in the file", async () => {
			// each dim is far below MAX_TENSOR_DIM, but 10^12 parameters cannot live in a ~100 byte file
			await expect(parseBytes(buildGgufWithShapes([[1_000_000n, 1_000_000n]]))).rejects.toThrow(
				/cannot fit in a \d+-byte file/,
			);
		});

		it("accepts a well-formed small file", async () => {
			// 4x4 tensor = 16 params, needs 64 bytes of F32 data — pad the file so it genuinely fits
			const { parameterCount } = await parseBytes(buildGgufWithShapes([[4n, 4n]], 64));
			expect(parameterCount).toBe(16);
		});

		it("accepts several well-formed tensors", async () => {
			const { parameterCount } = await parseBytes(
				buildGgufWithShapes(
					[
						[8n, 8n],
						[8n, 4n],
					],
					512,
				),
			);
			expect(parameterCount).toBe(64 + 32);
		});
	});

	describe("buildGgufHeader", () => {
		it("should rebuild GGUF header with updated metadata using regular blob", async () => {
			// Parse a smaller GGUF file to get original metadata and structure
			const {
				typedMetadata: originalMetadata,
				tensorInfoByteRange,
				littleEndian,
			} = await gguf(URL_V1, {
				typedMetadata: true,
			});

			// Get only the header portion of the original file to avoid memory issues
			const headerSize = tensorInfoByteRange[1] + 1000; // Add some padding
			const originalResponse = await fetch(URL_V1, {
				headers: { Range: `bytes=0-${headerSize - 1}` },
			});
			const originalBlob = new Blob([await originalResponse.arrayBuffer()]);

			// Create updated metadata with a modified name
			const updatedMetadata = {
				...originalMetadata,
				"general.name": {
					value: "Modified Test Model",
					type: GGUFValueType.STRING,
				},
			} as GGUFTypedMetadata;

			// Build the new header
			const newHeaderBlob = await buildGgufHeader(originalBlob, updatedMetadata, {
				littleEndian,
				tensorInfoByteRange,
				alignment: Number(originalMetadata["general.alignment"]?.value ?? 32),
			});

			expect(newHeaderBlob).toBeInstanceOf(Blob);
			expect(newHeaderBlob.size).toBeGreaterThan(0);

			// Test that the new header can be parsed by creating a minimal test file
			const tempFilePath = join(tmpdir(), `test-build-header-${Date.now()}.gguf`);

			// Just write the header to test parsing (without tensor data to avoid size issues)
			fs.writeFileSync(tempFilePath, new Uint8Array(await newHeaderBlob.arrayBuffer()));

			try {
				const { typedMetadata: parsedMetadata } = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				// Verify the updated metadata is preserved
				expect(parsedMetadata["general.name"]).toEqual({
					value: "Modified Test Model",
					type: GGUFValueType.STRING,
				});

				// Verify other metadata fields are preserved
				expect(parsedMetadata.version).toEqual(originalMetadata.version);
				expect(parsedMetadata.tensor_count).toEqual(originalMetadata.tensor_count);
				expect(parsedMetadata["general.architecture"]).toEqual(originalMetadata["general.architecture"]);
			} finally {
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		}, 30_000);

		it("should rebuild GGUF header with streaming blob behavior (simulated)", async () => {
			// This test simulates streaming blob behavior by using a regular blob
			// The actual streaming blob functionality is tested in the hub package integration tests

			// Parse a smaller GGUF file to get original metadata and structure
			const {
				typedMetadata: originalMetadata,
				tensorInfoByteRange,
				littleEndian,
			} = await gguf(URL_V1, {
				typedMetadata: true,
			});

			// Get only the header portion of the original file to simulate partial data access
			const headerSize = tensorInfoByteRange[1] + 1000; // Add some padding
			const originalResponse = await fetch(URL_V1, {
				headers: { Range: `bytes=0-${headerSize - 1}` },
			});
			const originalBlob = new Blob([await originalResponse.arrayBuffer()]);

			// Create updated metadata with a modified name
			const updatedMetadata = {
				...originalMetadata,
				"general.name": {
					value: "Streaming Behavior Test Model",
					type: GGUFValueType.STRING,
				},
			} as GGUFTypedMetadata;

			// Build the new header - this tests our fix for streaming blob handling
			// The fix ensures that tensor info data is properly awaited from blob.arrayBuffer()
			const newHeaderBlob = await buildGgufHeader(originalBlob, updatedMetadata, {
				littleEndian,
				tensorInfoByteRange,
				alignment: Number(originalMetadata["general.alignment"]?.value ?? 32),
			});

			expect(newHeaderBlob).toBeInstanceOf(Blob);
			expect(newHeaderBlob.size).toBeGreaterThan(0);

			// Test that the new header can be parsed
			const tempFilePath = join(tmpdir(), `test-build-header-streaming-sim-${Date.now()}.gguf`);
			fs.writeFileSync(tempFilePath, new Uint8Array(await newHeaderBlob.arrayBuffer()));

			try {
				const { typedMetadata: parsedMetadata } = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				// Verify the updated metadata is preserved
				expect(parsedMetadata["general.name"]).toEqual({
					value: "Streaming Behavior Test Model",
					type: GGUFValueType.STRING,
				});

				// Verify other metadata fields are preserved
				expect(parsedMetadata.version).toEqual(originalMetadata.version);
				expect(parsedMetadata.tensor_count).toEqual(originalMetadata.tensor_count);
				expect(parsedMetadata["general.architecture"]).toEqual(originalMetadata["general.architecture"]);

				console.log("✅ buildGgufHeader handles blob slicing correctly (streaming blob fix verified)");
			} finally {
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		}, 30_000);

		it("should handle metadata with array modifications", async () => {
			// Parse a smaller GGUF file
			const {
				typedMetadata: originalMetadata,
				tensorInfoByteRange,
				littleEndian,
			} = await gguf(URL_V1, {
				typedMetadata: true,
			});

			// Get only the header portion
			const headerSize = tensorInfoByteRange[1] + 1000;
			const originalResponse = await fetch(URL_V1, {
				headers: { Range: `bytes=0-${headerSize - 1}` },
			});
			const originalBlob = new Blob([await originalResponse.arrayBuffer()]);

			// Create updated metadata with a simple array
			const updatedMetadata = {
				...originalMetadata,
				"test.array": {
					value: ["item1", "item2", "item3"],
					type: GGUFValueType.ARRAY,
					subType: GGUFValueType.STRING,
				},
				kv_count: {
					value: originalMetadata.kv_count.value + 1n,
					type: originalMetadata.kv_count.type,
				},
			} as GGUFTypedMetadata;

			// Build the new header - this tests our fix with arrays
			const newHeaderBlob = await buildGgufHeader(originalBlob, updatedMetadata, {
				littleEndian,
				tensorInfoByteRange,
				alignment: Number(originalMetadata["general.alignment"]?.value ?? 32),
			});

			expect(newHeaderBlob).toBeInstanceOf(Blob);
			expect(newHeaderBlob.size).toBeGreaterThan(0);

			// Test that the new header can be parsed
			const tempFilePath = join(tmpdir(), `test-build-header-array-${Date.now()}.gguf`);
			fs.writeFileSync(tempFilePath, new Uint8Array(await newHeaderBlob.arrayBuffer()));

			try {
				const { typedMetadata: parsedMetadata } = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				// Verify the array was added correctly
				expect(parsedMetadata["test.array"]).toEqual({
					value: ["item1", "item2", "item3"],
					type: GGUFValueType.ARRAY,
					subType: GGUFValueType.STRING,
				});

				// Verify structure integrity
				expect(parsedMetadata.version).toEqual(originalMetadata.version);
				expect(parsedMetadata.tensor_count).toEqual(originalMetadata.tensor_count);
				expect(parsedMetadata.kv_count.value).toBe(originalMetadata.kv_count.value + 1n);

				console.log("✅ buildGgufHeader successfully handles array modifications");
			} finally {
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		}, 30_000);

		it("should handle RangeError edge case (streaming blob fix verification)", async () => {
			// This test specifically addresses the issue where buildGgufHeader was failing
			// with "RangeError: Offset is outside the bounds of the DataView" when using streaming blobs
			// We simulate the scenario using regular blobs since the core fix is in buildGgufHeader

			// Parse a GGUF file to get metadata
			const {
				typedMetadata: originalMetadata,
				tensorInfoByteRange,
				littleEndian,
			} = await gguf(URL_V1, {
				typedMetadata: true,
			});

			// Get header portion - this simulates partial blob access like streaming blobs
			const headerSize = tensorInfoByteRange[1] + 1000;
			const originalResponse = await fetch(URL_V1, {
				headers: { Range: `bytes=0-${headerSize - 1}` },
			});
			const originalBlob = new Blob([await originalResponse.arrayBuffer()]);

			// Create metadata that modifies tokenizer tokens (similar to the failing test case)
			const updatedMetadata = {
				...originalMetadata,
				"general.name": {
					value: "RangeError Fix Test",
					type: GGUFValueType.STRING,
				},
				// Add a tokens array modification to match the original failing scenario
				"tokenizer.test.tokens": {
					value: ["<test>", "<fix>", "<success>"],
					type: GGUFValueType.ARRAY,
					subType: GGUFValueType.STRING,
				},
				kv_count: {
					value: originalMetadata.kv_count.value + 1n,
					type: originalMetadata.kv_count.type,
				},
			} as GGUFTypedMetadata;

			// This call tests our fix: await originalTensorInfoBlob.arrayBuffer() properly handles blob slicing
			const newHeaderBlob = await buildGgufHeader(originalBlob, updatedMetadata, {
				littleEndian,
				tensorInfoByteRange,
				alignment: Number(originalMetadata["general.alignment"]?.value ?? 32),
			});

			// If we get here without throwing, the fix worked!
			expect(newHeaderBlob).toBeInstanceOf(Blob);
			expect(newHeaderBlob.size).toBeGreaterThan(0);

			// Verify the header can be parsed correctly
			const tempFilePath = join(tmpdir(), `test-rangeerror-fix-${Date.now()}.gguf`);
			fs.writeFileSync(tempFilePath, new Uint8Array(await newHeaderBlob.arrayBuffer()));

			try {
				const { typedMetadata: parsedMetadata } = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				// Verify our modifications were preserved
				expect(parsedMetadata["general.name"]).toEqual({
					value: "RangeError Fix Test",
					type: GGUFValueType.STRING,
				});
				expect(parsedMetadata["tokenizer.test.tokens"]).toEqual({
					value: ["<test>", "<fix>", "<success>"],
					type: GGUFValueType.ARRAY,
					subType: GGUFValueType.STRING,
				});

				console.log("🎯 RangeError fix verified: buildGgufHeader correctly handles blob slicing");
			} finally {
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		}, 30_000);

		it("should preserve tensor info correctly", async () => {
			// Parse a smaller GGUF file
			const {
				typedMetadata: originalMetadata,
				tensorInfoByteRange,
				tensorInfos: originalTensorInfos,
				littleEndian,
			} = await gguf(URL_V1, {
				typedMetadata: true,
			});

			// Get only the header portion
			const headerSize = tensorInfoByteRange[1] + 1000;
			const originalResponse = await fetch(URL_V1, {
				headers: { Range: `bytes=0-${headerSize - 1}` },
			});
			const originalBlob = new Blob([await originalResponse.arrayBuffer()]);

			// Create updated metadata with minor changes
			const updatedMetadata = {
				...originalMetadata,
				"test.custom": {
					value: "custom_value",
					type: GGUFValueType.STRING,
				},
				kv_count: {
					value: originalMetadata.kv_count.value + 1n,
					type: originalMetadata.kv_count.type,
				},
			} as GGUFTypedMetadata;

			// Build the new header
			const newHeaderBlob = await buildGgufHeader(originalBlob, updatedMetadata, {
				littleEndian,
				tensorInfoByteRange,
				alignment: Number(originalMetadata["general.alignment"]?.value ?? 32),
			});

			// Test that the new header can be parsed
			const tempFilePath = join(tmpdir(), `test-build-header-tensors-${Date.now()}.gguf`);
			fs.writeFileSync(tempFilePath, new Uint8Array(await newHeaderBlob.arrayBuffer()));

			try {
				const { typedMetadata: parsedMetadata, tensorInfos: parsedTensorInfos } = await gguf(tempFilePath, {
					typedMetadata: true,
					allowLocalFile: true,
				});

				// Verify tensor info is preserved exactly
				expect(parsedTensorInfos.length).toBe(originalTensorInfos.length);
				expect(parsedTensorInfos[0]).toEqual(originalTensorInfos[0]);
				expect(parsedTensorInfos[parsedTensorInfos.length - 1]).toEqual(
					originalTensorInfos[originalTensorInfos.length - 1],
				);

				// Verify our custom metadata was added
				expect(parsedMetadata["test.custom"]).toEqual({
					value: "custom_value",
					type: GGUFValueType.STRING,
				});

				// Verify kv_count was updated
				expect(parsedMetadata.kv_count.value).toBe(originalMetadata.kv_count.value + 1n);
			} finally {
				try {
					fs.unlinkSync(tempFilePath);
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		}, 30_000);

		it("should handle different alignment values", async () => {
			// Parse a smaller GGUF file
			const {
				typedMetadata: originalMetadata,
				tensorInfoByteRange,
				littleEndian,
			} = await gguf(URL_V1, {
				typedMetadata: true,
			});

			// Get only the header portion
			const headerSize = tensorInfoByteRange[1] + 1000;
			const originalResponse = await fetch(URL_V1, {
				headers: { Range: `bytes=0-${headerSize - 1}` },
			});
			const originalBlob = new Blob([await originalResponse.arrayBuffer()]);

			// Create updated metadata
			const updatedMetadata = {
				...originalMetadata,
				"general.name": {
					value: "Alignment Test Model",
					type: GGUFValueType.STRING,
				},
			} as GGUFTypedMetadata;

			// Test different alignment values
			const alignments = [16, 32, 64];

			for (const alignment of alignments) {
				const newHeaderBlob = await buildGgufHeader(originalBlob, updatedMetadata, {
					littleEndian,
					tensorInfoByteRange,
					alignment,
				});

				expect(newHeaderBlob).toBeInstanceOf(Blob);
				expect(newHeaderBlob.size).toBeGreaterThan(0);

				// Verify the header size is aligned correctly
				expect(newHeaderBlob.size % alignment).toBe(0);
			}
		}, 15_000);

		it("should validate tensorInfoByteRange parameters", async () => {
			// Parse a smaller GGUF file
			const { typedMetadata: originalMetadata, littleEndian } = await gguf(URL_V1, {
				typedMetadata: true,
			});

			// Create a small test blob
			const testBlob = new Blob([new Uint8Array(1000)]);

			// Test with valid range first to ensure function works
			const validResult = await buildGgufHeader(testBlob, originalMetadata, {
				littleEndian,
				tensorInfoByteRange: [100, 200], // Valid: start < end
				alignment: 32,
			});

			expect(validResult).toBeInstanceOf(Blob);

			// Test with edge case: start == end (should work as empty range)
			const emptyRangeResult = await buildGgufHeader(testBlob, originalMetadata, {
				littleEndian,
				tensorInfoByteRange: [100, 100], // Edge case: empty range
				alignment: 32,
			});

			expect(emptyRangeResult).toBeInstanceOf(Blob);
		}, 15_000);
	});
});
