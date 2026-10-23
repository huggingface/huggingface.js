import { describe, expect, it } from "vitest";

import { InferCraneConversationalTask } from "../src/providers/infercrane.js";

describe("InferCrane provider", () => {
	const provider = new InferCraneConversationalTask();

	it("uses the stable provider endpoint with a provider key", () => {
		expect(
			provider.makeUrl({
				authMethod: "provider-key",
				model: "qwen/qwen3.8-27b",
				task: "conversational",
			}),
		).toBe("https://provider.infercrane.com/v1/chat/completions");
	});

	it("uses the Hugging Face router with an HF token", () => {
		expect(
			provider.makeUrl({
				authMethod: "hf-token",
				model: "qwen/qwen3.8-27b",
				task: "conversational",
			}),
		).toBe("https://router.huggingface.co/infercrane/v1/chat/completions");
	});

	it("sends the resolved InferCrane model id", () => {
		expect(
			provider.preparePayload({
				args: {
					model: "Qwen/Qwen3.8-27B",
					messages: [{ role: "user", content: "Hello" }],
				},
				model: "qwen/qwen3.8-27b",
			}),
		).toEqual({
			model: "qwen/qwen3.8-27b",
			messages: [{ role: "user", content: "Hello" }],
		});
	});
});
