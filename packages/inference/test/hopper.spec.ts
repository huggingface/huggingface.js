import { afterEach, describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/InferenceClient.js";
import { inferenceProviderMappingCache } from "../src/lib/getInferenceProviderMapping.js";

const models = ["gemma-4-31b", "deepseek-v4.1-flash"] as const;

describe("Hopper", () => {
	afterEach(() => {
		inferenceProviderMappingCache.clear();
	});

	it.each(models)("routes %s with the mapped model ID and provider credentials", async (model) => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (url, init) => {
			if (String(url).startsWith("https://huggingface.co/api/models/")) {
				expect(new Headers(init?.headers).has("authorization")).toBe(false);
				return new Response(
					JSON.stringify({
						inferenceProviderMapping: {
							hopper: { providerId: model, status: "live", task: "conversational" },
						},
					}),
					{ headers: { "content-type": "application/json" } },
				);
			}
			expect(String(url)).toBe("https://api.withhopper.com/v1/chat/completions");
			expect(new Headers(init?.headers).get("authorization")).toBe("Bearer sk_hopper_test");
			expect(JSON.parse(String(init?.body))).toEqual({
				model,
				messages: [{ role: "user", content: "Hello" }],
				max_tokens: 32,
			});
			return new Response(
				JSON.stringify({
					id: "chatcmpl-test",
					object: "chat.completion",
					created: 1,
					model,
					choices: [{ index: 0, message: { role: "assistant", content: "Hello" }, finish_reason: "stop" }],
					usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
				}),
				{ headers: { "content-type": "application/json" } },
			);
		});
		const client = new InferenceClient("sk_hopper_test", { fetch: fetchMock });
		const response = await client.chatCompletion({
			provider: "hopper",
			model: `test-org/${model}`,
			messages: [{ role: "user", content: "Hello" }],
			max_tokens: 32,
		});
		expect(response.model).toBe(model);
		expect(response.choices[0].message.content).toBe("Hello");
		expect(response.usage).toEqual({ prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it.each(models)("streams %s through the HF router when given an HF token", async (model) => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (url, init) => {
			if (String(url).startsWith("https://huggingface.co/api/models/")) {
				return new Response(
					JSON.stringify({
						inferenceProviderMapping: {
							hopper: { providerId: model, status: "live", task: "conversational" },
						},
					}),
					{ headers: { "content-type": "application/json" } },
				);
			}
			expect(String(url)).toBe("https://router.huggingface.co/hopper/v1/chat/completions");
			expect(new Headers(init?.headers).get("authorization")).toBe("Bearer hf_test");
			expect(JSON.parse(String(init?.body))).toEqual({
				model,
				messages: [{ role: "user", content: "Hello" }],
				stream: true,
			});
			const chunk = {
				id: "chatcmpl-test",
				object: "chat.completion.chunk",
				created: 1,
				model,
				choices: [{ index: 0, delta: { content: "Hello" }, finish_reason: "stop" }],
			};
			return new Response(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`, {
				headers: { "content-type": "text/event-stream" },
			});
		});
		const client = new InferenceClient("hf_test", { fetch: fetchMock });
		const chunks = [];
		for await (const chunk of client.chatCompletionStream({
			provider: "hopper",
			model: `test-org/${model}`,
			messages: [{ role: "user", content: "Hello" }],
		})) {
			chunks.push(chunk);
		}
		expect(chunks).toHaveLength(1);
		expect(chunks[0].choices[0].delta.content).toBe("Hello");
		expect(chunks[0].choices[0].finish_reason).toBe("stop");
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
