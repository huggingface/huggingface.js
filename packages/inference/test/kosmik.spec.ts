import { describe, expect, it } from "vitest";
import { KosmikConversationalTask } from "../src/providers/kosmik.js";

const helper = new KosmikConversationalTask();

describe("Kosmik provider helper", () => {
	it("constructs the direct OpenAI-compatible conversational URL", () => {
		expect(
			helper.makeUrl({
				authMethod: "provider-key",
				model: "qwen/qwen3.8-27b",
				task: "conversational",
			}),
		).toBe("https://api.koscompute.com/v1/chat/completions");
	});

	it("uses bearer authentication and preserves the conversational payload", () => {
		expect(helper.prepareHeaders({ authMethod: "provider-key", accessToken: "test-token" }, false)).toEqual({
			Authorization: "Bearer test-token",
			"Content-Type": "application/json",
		});

		expect(
			helper.preparePayload({
				model: "qwen/qwen3.8-27b",
				task: "conversational",
				args: {
					model: "Qwen/Qwen3.8-27B-FP8:kosmik",
					messages: [{ role: "user", content: "Hello" }],
					stream: true,
					temperature: 0,
				},
			}),
		).toEqual({
			model: "qwen/qwen3.8-27b",
			messages: [{ role: "user", content: "Hello" }],
			stream: true,
			temperature: 0,
		});
	});

	it("accepts a valid OpenAI-compatible response", async () => {
		const response = {
			id: "test-id",
			created: 1,
			model: "qwen/qwen3.8-27b",
			system_fingerprint: "test",
			choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "OK" } }],
			usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
		};
		expect(await helper.getResponse(response)).toBe(response);
	});
});
