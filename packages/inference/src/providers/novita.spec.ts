import { describe, expect, it } from "vitest";

import { InferenceClientProviderOutputError } from "../errors.js";
import type { BodyParams } from "../types.js";
import { NovitaTextGenerationTask } from "./novita.js";

describe("NovitaTextGenerationTask", () => {
	const task = new NovitaTextGenerationTask();

	it("uses Novita's OpenAI-compatible chat completions route", () => {
		expect(task.makeRoute()).toBe("/v3/openai/chat/completions");
	});

	it("converts text-generation inputs and parameters to an OpenAI chat completion payload", () => {
		const params = {
			model: "novita/model",
			args: {
				inputs: "Once upon a time",
				parameters: {
					max_new_tokens: 32,
					temperature: 0.7,
				},
				provider: "novita",
			},
		} as BodyParams;

		expect(task.preparePayload(params)).toEqual({
			model: "novita/model",
			messages: [{ role: "user", content: "Once upon a time" }],
			provider: "novita",
			max_tokens: 32,
			temperature: 0.7,
		});
	});

	it("converts the first chat completion choice to text-generation output", async () => {
		await expect(task.getResponse({ choices: [{ message: { content: "The end." } }] })).resolves.toEqual({
			generated_text: "The end.",
		});
	});

	it("rejects malformed completion responses", async () => {
		await expect(task.getResponse({ choices: [] })).rejects.toBeInstanceOf(InferenceClientProviderOutputError);
	});
});
