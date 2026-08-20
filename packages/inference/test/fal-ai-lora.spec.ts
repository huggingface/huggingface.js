import { describe, expect, it } from "vitest";
import { FalAIImageToVideoTask, FalAITextToImageTask, FalAITextToVideoTask } from "../src/providers/fal-ai.js";
import type { BodyParams, InferenceProviderMappingEntry } from "../src/types.js";

const LORA_MAPPING: InferenceProviderMappingEntry = {
	adapter: "lora",
	adapterWeightsPath: "pytorch_lora_weights.safetensors",
	hfModelId: "InstantX/MiniMax-H3-Turbo-Lora-Diffusers",
	provider: "fal-ai",
	providerId: "minimax/h3/text-to-video/lora",
	status: "live",
	task: "text-to-video",
	type: "tag-filter",
};

const EXPECTED_LORAS = [
	{
		path: "https://huggingface.co/InstantX/MiniMax-H3-Turbo-Lora-Diffusers/resolve/main/pytorch_lora_weights.safetensors",
		scale: 1,
	},
];

function bodyParams(mapping?: InferenceProviderMappingEntry): BodyParams {
	return {
		args: { inputs: "a bee on a sunflower" },
		model: mapping?.providerId ?? "minimax/h3/text-to-video",
		mapping,
	};
}

describe("fal-ai LoRA payloads", () => {
	it("adds loras for text-to-video tag-filter mappings", () => {
		expect(new FalAITextToVideoTask().preparePayload(bodyParams(LORA_MAPPING)).loras).toEqual(EXPECTED_LORAS);
	});

	it("omits loras when the mapping is not a LoRA adapter", () => {
		expect(new FalAITextToVideoTask().preparePayload(bodyParams()).loras).toBeUndefined();
		expect(
			new FalAITextToVideoTask().preparePayload(bodyParams({ ...LORA_MAPPING, adapter: undefined })).loras,
		).toBeUndefined();
	});

	it("omits loras when the adapter weights path is unknown", () => {
		expect(
			new FalAITextToVideoTask().preparePayload(bodyParams({ ...LORA_MAPPING, adapterWeightsPath: undefined })).loras,
		).toBeUndefined();
	});

	it("stays consistent with the other LoRA-capable tasks", () => {
		expect(new FalAITextToImageTask().preparePayload(bodyParams(LORA_MAPPING)).loras).toEqual(EXPECTED_LORAS);
		expect(new FalAIImageToVideoTask().preparePayload(bodyParams(LORA_MAPPING)).loras).toEqual(EXPECTED_LORAS);
	});
});
