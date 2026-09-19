import { describe, expect, it } from "vitest";
import { IteraComputeConversationalTask } from "../src/providers/iteracompute.js";

describe("IteraCompute provider", () => {
	const task = new IteraComputeConversationalTask();

	it("uses the dedicated gateway for provider keys and the HF router for HF tokens", () => {
		expect(
			task.makeUrl({
				authMethod: "provider-key",
				model: "iteracompute/qwen3.8-27b",
				task: "conversational",
			}),
		).toBe("https://api.iteracompute.com/hf/v1/chat/completions");
		expect(
			task.makeUrl({
				authMethod: "hf-token",
				model: "iteracompute/qwen3.8-27b",
				task: "conversational",
			}),
		).toBe("https://router.huggingface.co/iteracompute/v1/chat/completions");
	});

	it("forwards OpenAI chat parameters with the mapped provider model", () => {
		const responseFormat = {
			type: "json_schema",
			json_schema: {
				name: "probe",
				strict: true,
				schema: { type: "object" },
			},
		};
		const tools = [{ type: "function", function: { name: "probe", parameters: { type: "object" } } }];

		expect(
			task.preparePayload({
				model: "iteracompute/qwen3.8-27b",
				task: "conversational",
				args: {
					model: "Qwen/Qwen3.8-27B:iteracompute",
					messages: [{ role: "user", content: "hello" }],
					response_format: responseFormat,
					tools,
					stream: true,
				},
			}),
		).toEqual({
			model: "iteracompute/qwen3.8-27b",
			messages: [{ role: "user", content: "hello" }],
			response_format: responseFormat,
			tools,
			stream: true,
		});
	});

	it("uses bearer authentication and JSON request bodies", () => {
		expect(task.prepareHeaders({ authMethod: "provider-key", accessToken: "secret" }, false)).toEqual({
			Authorization: "Bearer secret",
			"Content-Type": "application/json",
		});
	});
});
