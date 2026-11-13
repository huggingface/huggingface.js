import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/index.js";
import { HARDCODED_MODEL_INFERENCE_MAPPING } from "../src/providers/consts.js";

const models = ["zai-org/GLM-5.3", "deepseek-ai/DeepSeek-V4-Flash-0731"];
const originalMapping = HARDCODED_MODEL_INFERENCE_MAPPING.corvex;

describe("Corvex current model routing", () => {
	beforeEach(() => {
		HARDCODED_MODEL_INFERENCE_MAPPING.corvex = Object.fromEntries(
			models.map((model) => [
				model,
				{ provider: "corvex", hfModelId: model, providerId: model, status: "live", task: "conversational" },
			]),
		);
	});

	afterEach(() => {
		HARDCODED_MODEL_INFERENCE_MAPPING.corvex = originalMapping;
	});

	it.each(models)("sends %s directly with a provider key", async (model) => {
		const fetch = vi.fn<Parameters<typeof globalThis.fetch>, ReturnType<typeof globalThis.fetch>>(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						id: "chatcmpl-test",
						object: "chat.completion",
						created: 1,
						model,
						choices: [{ index: 0, message: { role: "assistant", content: "Paris" }, finish_reason: "stop" }],
						usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
					}),
					{ headers: { "Content-Type": "application/json" } },
				),
			),
		);
		const result = await new InferenceClient("sk-corvex-test", { fetch }).chatCompletion({
			provider: "corvex",
			model,
			messages: [{ role: "user", content: "What is the capital of France?" }],
			max_tokens: 64,
			reasoning_effort: "low",
		});
		expect(result.choices[0].message.content).toBe("Paris");
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch.mock.calls[0][0]).toBe("https://api.tokenfactory.corvex.cloud/v1/chat/completions");
		expect(new Headers(fetch.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer sk-corvex-test");
		expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({
			model,
			max_tokens: 64,
			reasoning_effort: "low",
		});
	});

	it.each(models)("streams %s through the HF router with a HF token", async (model) => {
		const fetch = vi.fn<Parameters<typeof globalThis.fetch>, ReturnType<typeof globalThis.fetch>>(() =>
			Promise.resolve(
				new Response(
					`data: ${JSON.stringify({
						id: "chatcmpl-test",
						object: "chat.completion.chunk",
						created: 1,
						model,
						choices: [{ index: 0, delta: { content: "Paris" }, finish_reason: null }],
					})}\n\ndata: [DONE]\n\n`,
					{ headers: { "Content-Type": "text/event-stream" } },
				),
			),
		);
		const chunks = [];
		for await (const chunk of new InferenceClient("hf_test", { fetch }).chatCompletionStream({
			provider: "corvex",
			model,
			messages: [{ role: "user", content: "What is the capital of France?" }],
			max_tokens: 64,
		})) {
			chunks.push(chunk);
		}
		expect(chunks[0].choices[0].delta.content).toBe("Paris");
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch.mock.calls[0][0]).toBe("https://router.huggingface.co/corvex/v1/chat/completions");
		expect(new Headers(fetch.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer hf_test");
		expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({ model, stream: true });
	});
});
