import { assert, describe, it } from "vitest";

import {
	computeParameterCountByComponent,
	createSafetensorsComponentClassifier,
} from "./safetensors-component-analysis";
import type {
	Dtype,
	ModelConfig,
	SafetensorsFileHeader,
	SafetensorsParameterCountByComponent,
	TensorInfo,
} from "./safetensors-analysis-types";

const tensor = (size: number, dtype: Dtype = "F32"): TensorInfo => ({
	dtype,
	shape: [size],
	data_offsets: [0, 0],
});

const sumComponents = (counts: SafetensorsParameterCountByComponent): number =>
	Object.values(counts).reduce<number>((total, count) => total + (count ?? 0), 0);

describe("safetensors component analysis", () => {
	it("attributes Qwen4Exp backbone, n-gram, MTP, and vision tensors to disjoint buckets", () => {
		const headers: SafetensorsFileHeader[] = [
			{
				"model.language_model.embed_tokens.weight": tensor(11),
				"model.language_model.layers.1.ple.ple_embedding.ngram_embedding.shard_0.weight": tensor(13),
			},
			{
				"mtp.0.fc.weight": tensor(17),
				"model.visual.patch_embed.proj.weight": tensor(19),
				"lm_head.weight": tensor(23),
			},
		];
		const config: ModelConfig = {
			architectures: ["Qwen4ExpForConditionalGeneration"],
			model_type: "qwen4_exp",
			text_config: {
				model_type: "qwen4_exp_text",
				mtp_num_hidden_layers: 1,
				ngram_size: 3,
				ple_layer_ids: [2],
			},
			vision_config: { model_type: "qwen4_exp_vision" },
		};

		const counts = computeParameterCountByComponent(headers, config);

		assert.deepStrictEqual(counts, {
			backbone: 34,
			ngram: 13,
			mtp: 17,
			vision: 19,
		});
		assert(counts);
		assert.strictEqual(sumComponents(counts), 83);
	});

	it("attributes DeepSeek V4.1 components using logical FP4 expert counts and excludes scale tensors", () => {
		const headers: SafetensorsFileHeader[] = [
			{
				"embed.weight": tensor(11, "BF16"),
				"layers.1.engram.embed.weight": tensor(13, "BF16"),
				"layers.1.engram.embed.scale": tensor(1_000, "F8_E8M0"),
				"mtp.0.ffn.experts.0.w1.weight": tensor(17, "I8"),
				"mtp.0.ffn.experts.0.w1.scale": tensor(2_000, "F8_E8M0"),
			},
			{
				"mtp.0.attn.wkv.weight": tensor(19, "I8"),
				"mtp.0.attn.wkv.scale": tensor(3_000, "F8_E8M0"),
				"vision.patch_embed.proj.weight": tensor(23, "BF16"),
				"aligner.fc.weight": tensor(29, "BF16"),
				image_start: tensor(31, "BF16"),
			},
		];
		const config: ModelConfig = {
			architectures: ["DeepseekV41ForCausalLM"],
			model_type: "deepseek_v41",
			quantization_config: {
				quant_method: "fp8",
				expert_dtype: "fp4",
			},
			text_config: {
				model_type: "deepseek_v41_text",
				num_nextn_predict_layers: 3,
				engram_layer_ids: [1, 14],
				dspark_block_size: 5,
			},
			vision_config: { model_type: "deepseek_v41_vision" },
		};

		const counts = computeParameterCountByComponent(headers, config);

		assert.deepStrictEqual(counts, {
			backbone: 11,
			engram: 13,
			// Two logical FP4 parameters are packed into each I8 expert element. The other
			// DSpark I8 weight is not a routed expert, so it remains one parameter per element.
			dspark: 34 + 19,
			vision: 23 + 29 + 31,
		});
		assert(counts);
		assert.strictEqual(sumComponents(counts), 160);
	});

	it("uses config semantics to distinguish DSpark from ordinary MTP tensors", () => {
		const mtpTensor = "mtp.0.ffn.experts.0.w1.weight";
		const mtpClassifier = createSafetensorsComponentClassifier({
			model_type: "deepseek_v41",
			text_config: { num_nextn_predict_layers: 3 },
		});
		const dsparkClassifier = createSafetensorsComponentClassifier({
			model_type: "deepseek_v41",
			text_config: { num_nextn_predict_layers: 3, dspark_block_size: 5 },
		});

		assert(mtpClassifier);
		assert(dsparkClassifier);
		assert.strictEqual(mtpClassifier(mtpTensor), "mtp");
		assert.strictEqual(dsparkClassifier(mtpTensor), "dspark");
	});

	it("recognizes complete family namespaces from canonical architecture tags", () => {
		const qwenClassifier = createSafetensorsComponentClassifier({
			architectures: ["Qwen4ExpForConditionalGeneration"],
			mtp_num_hidden_layers: 1,
			ngram_size: 3,
			ple_layer_ids: [2],
			vision_config: {},
		});
		const deepseekClassifier = createSafetensorsComponentClassifier({
			architectures: ["DeepseekV41ForCausalLM"],
			num_nextn_predict_layers: 3,
			engram_layer_ids: [1, 14],
			dspark_block_size: 5,
			vision_config: {},
		});

		assert(qwenClassifier);
		assert.strictEqual(qwenClassifier("model.language_model.layers.1.ple.key_proj.weight"), "ngram");
		assert.strictEqual(qwenClassifier("model.visual.patch_embed.proj.weight"), "vision");
		assert(deepseekClassifier);
		assert.strictEqual(deepseekClassifier("layers.1.engram.embed.weight"), "engram");
		assert.strictEqual(deepseekClassifier("mtp.0.main_proj.weight"), "dspark");
		assert.strictEqual(deepseekClassifier("aligner.w1.weight"), "vision");
	});

	it("recognizes canonical standalone DFlash and EAGLE3 configs despite generic tensor names", () => {
		const headers: SafetensorsFileHeader[] = [
			{
				"midlayer.0.weight": tensor(7),
				"fc.weight": tensor(11),
				"lm_head.weight": tensor(13),
			},
		];

		assert.deepStrictEqual(computeParameterCountByComponent(headers, { model_type: "muse_glimmer_assistant" }), {
			dflash: 31,
		});
		assert.deepStrictEqual(computeParameterCountByComponent(headers, { architectures: ["LlamaForCausalLMEagle3"] }), {
			eagle3: 31,
		});
	});

	it("returns undefined for unknown configs and recognized configs with no special tensors", () => {
		const backboneOnly: SafetensorsFileHeader[] = [{ "model.language_model.embed_tokens.weight": tensor(11) }];

		assert.strictEqual(createSafetensorsComponentClassifier(null), undefined);
		assert.strictEqual(createSafetensorsComponentClassifier({ model_type: "bert" }), undefined);
		assert.strictEqual(computeParameterCountByComponent(backboneOnly, { model_type: "bert" }), undefined);
		assert.strictEqual(
			computeParameterCountByComponent(backboneOnly, {
				model_type: "qwen4_exp",
				text_config: { mtp_num_hidden_layers: 1 },
			}),
			undefined,
		);
	});
});
