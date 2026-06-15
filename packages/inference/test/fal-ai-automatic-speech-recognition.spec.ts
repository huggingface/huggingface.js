import { describe, expect, it } from "vitest";
import { InferenceClientProviderOutputError } from "../src/errors.js";
import { FalAIAutomaticSpeechRecognitionTask } from "../src/providers/fal-ai.js";

describe("FalAIAutomaticSpeechRecognitionTask.getResponse", () => {
	const task = new FalAIAutomaticSpeechRecognitionTask();

	it("parses the whisper `text` shape", async () => {
		const out = await task.getResponse({ text: "hello world" });
		expect(out).toEqual({ text: "hello world" });
	});

	it("parses the nemotron `output` shape", async () => {
		// fal's nemotron endpoint returns { output, partial } instead of { text }.
		const out = await task.getResponse({ output: "hola mundo", partial: false });
		expect(out).toEqual({ text: "hola mundo" });
	});

	it("surfaces whisper `chunks` timestamps", async () => {
		const out = await task.getResponse({
			text: "hi there",
			chunks: [
				{ timestamp: [0, 0.5], text: "hi" },
				{ timestamp: [0.5, 1], text: "there" },
			],
		});
		expect(out).toEqual({
			text: "hi there",
			chunks: [
				{ text: "hi", timestamp: [0, 0.5] },
				{ text: "there", timestamp: [0.5, 1] },
			],
		});
	});

	it("normalizes `segments` to chunks", async () => {
		const out = await task.getResponse({
			output: "one two",
			segments: [
				{ start: 0, end: 1, text: "one" },
				{ start: 1, end: 2, text: "two" },
			],
		});
		expect(out).toEqual({
			text: "one two",
			chunks: [
				{ text: "one", timestamp: [0, 1] },
				{ text: "two", timestamp: [1, 2] },
			],
		});
	});

	it("throws when neither text nor output is present", async () => {
		await expect(task.getResponse({ partial: false })).rejects.toBeInstanceOf(InferenceClientProviderOutputError);
	});
});
