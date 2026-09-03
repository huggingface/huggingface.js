import { describe, expect, it } from "vitest";
import { NeuronpoolConversationalTask } from "../src/providers/neuronpool.js";

const helper = new NeuronpoolConversationalTask();

describe("NeuronpoolConversationalTask", () => {
	it("makeBaseUrl is https://api.neuronpool.dev with a provider key", () => {
		expect(helper.makeBaseUrl({ authMethod: "provider-key", model: "gpt-oss-20b" })).toBe(
			"https://api.neuronpool.dev",
		);
	});

	it("makeUrl is OpenAI chat completions on the NeuronPool origin", () => {
		expect(helper.makeUrl({ authMethod: "provider-key", model: "gpt-oss-20b" })).toBe(
			"https://api.neuronpool.dev/v1/chat/completions",
		);
	});

	it("makeRoute is the OpenAI chat completions path (no Groq-style /openai prefix)", () => {
		expect(helper.makeRoute()).toBe("v1/chat/completions");
	});

	it("preparePayload snapshots a chat completion body with the provider model id", () => {
		expect(
			helper.preparePayload({
				model: "gpt-oss-20b",
				args: {
					messages: [{ role: "user", content: "Say hello." }],
					temperature: 0,
					max_tokens: 16,
					model: "openai/gpt-oss-20b",
				},
			}),
		).toEqual({
			model: "gpt-oss-20b",
			messages: [{ role: "user", content: "Say hello." }],
			temperature: 0,
			max_tokens: 16,
		});
	});
});
