import { describe, expect, it } from "vitest";
import { GGMLQuantizationType, gguf, parseGgufShardFile } from "./gguf";

const URL_LLAMA = "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/191239b/llama-2-7b-chat.Q2_K.gguf";
const URL_MISTRAL_7B =
	"https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/3a6fbf4/mistral-7b-instruct-v0.2.Q5_K_M.gguf";
const URL_GEMMA_2B = "https://huggingface.co/lmstudio-ai/gemma-2b-it-GGUF/resolve/a0b140b/gemma-2b-it-q4_k_m.gguf";
const URL_BIG_ENDIAN =
	"https://huggingface.co/ggml-org/models/resolve/1213976/bert-bge-small/ggml-model-f16-big-endian.gguf";
const URL_V1 =
	"https://huggingface.co/tmadge/testing/resolve/66c078028d1ff92d7a9264a1590bc61ba6437933/tinyllamas-stories-260k-f32.gguf";

describe("gguf", () => {
	it("should parse a llama2 7b", async () => {
		const { metadata, tensorInfos } = await gguf(URL_LLAMA);

		/// metadata

		expect(metadata).toMatchObject({
			// partial list, do not exhaustively list (tokenizer is quite big for instance)
			version: 2,
			tensor_count: 291n,
			kv_count: 19n,
			"general.architecture": "llama",
			"general.file_type": 10,
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
			"general.file_type": 17,
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
			"general.file_type": GGMLQuantizationType.Q8_K, // 15
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
			"general.file_type": GGMLQuantizationType.F16,
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

	it("should detect sharded gguf filename", async () => {
		const ggufPath = "grok-1/grok-1-q4_0-00003-of-00009.gguf"; // https://huggingface.co/ggml-org/models/blob/fcf344adb9686474c70e74dd5e55465e9e6176ef/grok-1/grok-1-q4_0-00003-of-00009.gguf
		const ggufShardFileInfo = parseGgufShardFile(ggufPath);

		expect(ggufShardFileInfo?.prefix).toEqual("grok-1/grok-1-q4_0");
		expect(ggufShardFileInfo?.shard).toEqual("00003");
		expect(ggufShardFileInfo?.total).toEqual("00009");
	});
});
