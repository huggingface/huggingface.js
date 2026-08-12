import { describe, expect, it } from "vitest";
import { makeRequestOptionsFromResolvedModel } from "../src/lib/makeRequestOptions.js";
import { FalAIImageTextToVideoTask } from "../src/providers/fal-ai.js";
import type { InferenceProviderMappingEntry, RequestArgs } from "../src/types.js";

const LORA_MAPPING = {
	provider: "fal-ai",
	hfModelId: "example/video-lora",
	providerId: "minimax/h3/image-to-video/lora",
	status: "live",
	task: "image-to-video",
	adapter: "lora",
	adapterWeightsPath: "adapter.safetensors",
} satisfies InferenceProviderMappingEntry;

const NON_LORA_MAPPING = {
	provider: "fal-ai",
	hfModelId: "example/base-video-model",
	providerId: "minimax/h3/image-to-video",
	status: "live",
	task: "image-to-video",
} satisfies InferenceProviderMappingEntry;

async function requestPayload(
	args: Parameters<FalAIImageTextToVideoTask["preparePayloadAsync"]>[0],
	mapping: InferenceProviderMappingEntry,
): Promise<Record<string, unknown>> {
	const helper = new FalAIImageTextToVideoTask();
	const preparedArgs = await helper.preparePayloadAsync(args);
	const { info } = makeRequestOptionsFromResolvedModel(
		mapping.providerId,
		helper,
		preparedArgs as RequestArgs,
		mapping,
		{ task: "image-text-to-video" },
	);
	return JSON.parse(info.body as string) as Record<string, unknown>;
}

describe("fal-ai image-text-to-video request payloads", () => {
	it("adds LoRA mapping data to an inherited prompt-only request", async () => {
		await expect(requestPayload({ parameters: { prompt: "A bee takes flight" } }, LORA_MAPPING)).resolves.toEqual({
			prompt: "A bee takes flight",
			loras: [
				{
					path: "https://huggingface.co/example/video-lora/resolve/main/adapter.safetensors",
					scale: 1,
				},
			],
		});
	});

	it("adds LoRA mapping data when an image is present", async () => {
		const inputs = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });

		await expect(
			requestPayload({ inputs, parameters: { prompt: "A bee takes flight" } }, LORA_MAPPING),
		).resolves.toEqual({
			prompt: "A bee takes flight",
			image_url: "data:image/png;base64,AQID",
			loras: [
				{
					path: "https://huggingface.co/example/video-lora/resolve/main/adapter.safetensors",
					scale: 1,
				},
			],
		});
	});

	it("does not add LoRA data for a non-LoRA mapping", async () => {
		await expect(requestPayload({ parameters: { prompt: "A bee takes flight" } }, NON_LORA_MAPPING)).resolves.toEqual({
			prompt: "A bee takes flight",
		});
	});
});
