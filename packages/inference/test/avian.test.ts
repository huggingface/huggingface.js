import { describe, it, expect } from "vitest";
import type { ChatCompletionStreamOutput } from "@huggingface/tasks";
import { InferenceClient, chatCompletion, chatCompletionStream } from "../src/index.js";
import { HARDCODED_MODEL_INFERENCE_MAPPING } from "../src/providers/consts.js";

const TIMEOUT = 60000 * 3;
const env = import.meta.env;

if (!env.HF_TOKEN) {
	console.warn("Set HF_TOKEN in the env to run the tests for better rate limits");
}

describe.skip.concurrent(
	"Avian",
	() => {
		const client = new InferenceClient(env.HF_AVIAN_KEY ?? "dummy");

		HARDCODED_MODEL_INFERENCE_MAPPING["avian"] = {
			"zai-org/GLM-4.6": {
				provider: "avian",
				hfModelId: "zai-org/GLM-4.6",
				providerId: "glm-4.6",
				status: "live",
				task: "conversational",
			},
		};

		it("chatCompletion", async () => {
			const res = await client.chatCompletion({
				model: "zai-org/GLM-4.6",
				provider: "avian",
				messages: [{ role: "user", content: "Complete this sentence with words, one plus one is equal " }],
			});
			if (res.choices && res.choices.length > 0) {
				const completion = res.choices[0].message?.content;
				expect(completion).toContain("two");
			}
		});

		it("chatCompletion stream", async () => {
			const stream = client.chatCompletionStream({
				model: "zai-org/GLM-4.6",
				provider: "avian",
				messages: [{ role: "user", content: "Complete the equation 1 + 1 = , just the answer" }],
				stream: true,
			}) as AsyncGenerator<ChatCompletionStreamOutput>;

			let fullResponse = "";
			for await (const chunk of stream) {
				if (chunk.choices && chunk.choices.length > 0) {
					const content = chunk.choices[0].delta?.content;
					if (content) {
						fullResponse += content;
					}
				}
			}

			expect(fullResponse).toBeTruthy();
			expect(fullResponse.length).toBeGreaterThan(0);
			expect(fullResponse).toMatch(/(two|2)/i);
		});

		it("chatCompletion - using chatCompletion function", async () => {
			const res = await chatCompletion({
				accessToken: env.HF_AVIAN_KEY ?? "dummy",
				model: "zai-org/GLM-4.6",
				provider: "avian",
				messages: [{ role: "user", content: "Complete this sentence with words, one plus one is equal " }],
				temperature: 0.1,
			});

			expect(res).toBeDefined();
			expect(res.choices).toBeDefined();
			expect(res.choices?.length).toBeGreaterThan(0);

			if (res.choices && res.choices.length > 0) {
				const completion = res.choices[0].message?.content;
				expect(completion).toBeDefined();
				expect(typeof completion).toBe("string");
				expect(completion).toMatch(/(two|2)/i);
			}
		});

		it("chatCompletion stream - using chatCompletionStream function", async () => {
			const stream = chatCompletionStream({
				accessToken: env.HF_AVIAN_KEY ?? "dummy",
				model: "zai-org/GLM-4.6",
				provider: "avian",
				messages: [{ role: "user", content: "Complete the equation 1 + 1 = , just the answer" }],
			}) as AsyncGenerator<ChatCompletionStreamOutput>;

			let out = "";
			for await (const chunk of stream) {
				if (chunk.choices && chunk.choices.length > 0) {
					out += chunk.choices[0].delta.content;
				}
			}
			expect(out).toMatch(/(two|2)/i);
		});
	},
	TIMEOUT
);
