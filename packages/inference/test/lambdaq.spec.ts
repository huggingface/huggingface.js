import { describe, expect, it } from "vitest";
import {
	LambdaQFeatureExtractionTask,
	LambdaQTextGenerationTask,
	LambdaQTextToImageTask,
	LambdaQTextToSpeechTask,
} from "../src/providers/lambdaq.js";
import { InferenceClientInputError, InferenceClientProviderOutputError } from "../src/errors.js";
import type { BodyParams } from "../src/types.js";

/**
 * LambdaQ speaks OpenAI on every route, so each task needs a translation between the HF task
 * schema and that shape. These cover the parts of the translation that fail silently rather
 * than loudly if they are wrong.
 */
describe("LambdaQ", () => {
	describe("text-to-image", () => {
		const helper = new LambdaQTextToImageTask();

		it("sends the requested size as one OpenAI `size` string", () => {
			// A model handed `width`/`height` does not error: it returns its default resolution.
			// Images are billed per image, so that is a wasted generation, not a retry.
			const payload = helper.preparePayload({
				args: { inputs: "a bee on a sunflower", parameters: { width: 512, height: 768 } },
				model: "sdxl-turbo",
			} as BodyParams<never>);

			expect(payload).toEqual({
				prompt: "a bee on a sunflower",
				model: "sdxl-turbo",
				size: "512x768",
			});
		});

		it("passes other generation parameters through untouched", () => {
			const payload = helper.preparePayload({
				args: {
					inputs: "a bee",
					parameters: { num_inference_steps: 2, guidance_scale: 1.5, negative_prompt: "blurry", seed: 42 },
				},
				model: "sdxl-turbo",
			} as BodyParams<never>);

			expect(payload).toMatchObject({
				num_inference_steps: 2,
				guidance_scale: 1.5,
				negative_prompt: "blurry",
				seed: 42,
			});
		});

		it("never lets a caller parameter override the mapped model id", () => {
			const payload = helper.preparePayload({
				args: { inputs: "a bee", model: "some-other-model" },
				model: "sdxl-turbo",
			} as BodyParams<never>);

			expect(payload.model).toBe("sdxl-turbo");
		});

		it("rejects URL output before spending a generation on it", async () => {
			expect(() =>
				helper.preparePayload({
					args: { inputs: "a bee" },
					model: "sdxl-turbo",
					outputType: "url",
				} as BodyParams<never>),
			).toThrowError(InferenceClientInputError);
		});

		it("labels the data URL with the format the bytes actually are", async () => {
			// LambdaQ resells several image models and returns whatever its upstream produced,
			// so the container is not always JPEG.
			const png = "iVBORw0KGgoAAAANSUhEUg";
			await expect(helper.getResponse({ data: [{ b64_json: png }] }, undefined, undefined, "dataUrl")).resolves.toBe(
				`data:image/png;base64,${png}`,
			);

			const jpeg = "/9j/4AAQSkZJRgABAQ";
			await expect(helper.getResponse({ data: [{ b64_json: jpeg }] }, undefined, undefined, "dataUrl")).resolves.toBe(
				`data:image/jpeg;base64,${jpeg}`,
			);
		});

		it("throws on a response carrying neither bytes nor a link", async () => {
			await expect(helper.getResponse({ data: [{ url: null }] })).rejects.toBeInstanceOf(
				InferenceClientProviderOutputError,
			);
		});
	});

	describe("text-generation", () => {
		const helper = new LambdaQTextGenerationTask();

		it("maps inputs and max_new_tokens onto the completions shape", () => {
			const payload = helper.preparePayload({
				args: { inputs: "Paris is", parameters: { max_new_tokens: 8, temperature: 0 } },
				model: "deepseek-v3.2",
			} as BodyParams<never>);

			expect(payload).toEqual({
				prompt: "Paris is",
				max_tokens: 8,
				temperature: 0,
				model: "deepseek-v3.2",
			});
		});

		it("maps max_new_tokens onto max_tokens when it is passed at the top level", () => {
			// The OpenAI-shaped route ignores the name rather than rejecting it, so an untranslated
			// max_new_tokens does not fail: it generates to the context limit, and bills for it.
			const payload = helper.preparePayload({
				args: { inputs: "Paris is", max_new_tokens: 8 },
				model: "deepseek-v3.2",
			} as BodyParams<never>);

			expect(payload).toEqual({ prompt: "Paris is", max_tokens: 8, model: "deepseek-v3.2" });
		});

		it("reads the completion out of the OpenAI choices array", async () => {
			await expect(
				helper.getResponse({ choices: [{ text: " a city of love" }], model: "deepseek-v3.2" }),
			).resolves.toEqual({ generated_text: " a city of love" });
		});
	});

	describe("feature-extraction", () => {
		const helper = new LambdaQFeatureExtractionTask();

		it("sends the texts as OpenAI `input`", () => {
			expect(
				helper.preparePayload({
					args: { inputs: ["one", "two"] },
					model: "all-mpnet-base-v2",
				} as BodyParams<never>),
			).toEqual({ input: ["one", "two"], model: "all-mpnet-base-v2" });
		});

		it("returns the embeddings in request order, unwrapped", async () => {
			await expect(
				helper.getResponse({
					data: [
						{ embedding: [0.1, 0.2], index: 0, object: "embedding" },
						{ embedding: [0.3, 0.4], index: 1, object: "embedding" },
					],
					model: "all-mpnet-base-v2",
					object: "list",
				}),
			).resolves.toEqual([
				[0.1, 0.2],
				[0.3, 0.4],
			]);
		});
	});

	describe("text-to-speech", () => {
		const helper = new LambdaQTextToSpeechTask();

		it("sends the text as OpenAI `input` and keeps a caller-chosen voice", () => {
			expect(
				helper.preparePayload({
					args: { inputs: "hello there", parameters: { voice: "af_bella" } },
					model: "kokoro-82m",
				} as BodyParams<never>),
			).toEqual({ input: "hello there", voice: "af_bella", model: "kokoro-82m" });
		});
	});

	it("routes each task to its OpenAI-compatible path", () => {
		expect(new LambdaQTextGenerationTask().makeRoute()).toBe("v1/completions");
		expect(new LambdaQFeatureExtractionTask().makeRoute()).toBe("v1/embeddings");
		expect(new LambdaQTextToImageTask().makeRoute()).toBe("v1/images/generations");
		expect(new LambdaQTextToSpeechTask().makeRoute()).toBe("v1/audio/speech");
	});
});
