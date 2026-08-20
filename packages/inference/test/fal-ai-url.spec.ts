import { describe, expect, it } from "vitest";
import { FalAIImageTextToImageTask, FalAIImageTextToVideoTask, FalAITextToVideoTask } from "../src/providers/fal-ai.js";
import type { AuthMethod, BodyParams, InferenceProviderMappingEntry } from "../src/types.js";

async function urlFor(
	helper: FalAIImageTextToImageTask | FalAIImageTextToVideoTask,
	providerId: string,
	authMethod: AuthMethod,
	args: Record<string, unknown>,
): Promise<string> {
	const payload = await helper.preparePayloadAsync(args as never);
	return helper.makeUrl({
		authMethod,
		model: providerId,
		task: helper.task,
		urlTransform: (payload as { urlTransform?: (url: string) => string }).urlTransform,
	});
}

async function bodyFor(
	providerId: string,
	args: Record<string, unknown>,
	adapter?: "lora",
): Promise<Record<string, unknown>> {
	const helper = new FalAIImageTextToVideoTask();
	const prepared = await helper.preparePayloadAsync(args as never);
	return helper.preparePayload({
		args: prepared as Record<string, unknown>,
		model: providerId,
		task: "image-text-to-video",
		mapping: {
			provider: "fal-ai",
			providerId,
			hfModelId: "MiniMaxAI/MiniMax-H3",
			status: "live",
			task: "image-text-to-video",
			...(adapter ? { adapter, adapterWeightsPath: "pytorch_lora_weights.safetensors" } : undefined),
		},
	} as BodyParams);
}

const PROMPT_ONLY = { parameters: { prompt: "a bee on a sunflower" } };
const IMAGE = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
const WITH_IMAGE = { inputs: IMAGE, ...PROMPT_ONLY };

const REFERENCE_TO_VIDEO = "minimax/h3/reference-to-video";
const IMAGE_TO_VIDEO = "minimax/h3/image-to-video";

describe("fal-ai request URLs", () => {
	describe("image-text-to-video", () => {
		// Unlike `fal-ai/flux-2/edit`, MiniMax-H3 has no text-only variant at the parent path:
		// `minimax/h3` is not an endpoint at all, and both mapped endpoints already accept a
		// prompt-only call. So the URL is never rewritten, for direct calls or routed ones.
		it.each([
			["hf-token", PROMPT_ONLY, "https://router.huggingface.co/fal-ai/minimax/h3/reference-to-video?_subdomain=queue"],
			["hf-token", WITH_IMAGE, "https://router.huggingface.co/fal-ai/minimax/h3/reference-to-video?_subdomain=queue"],
			["provider-key", PROMPT_ONLY, "https://queue.fal.run/minimax/h3/reference-to-video"],
			["provider-key", WITH_IMAGE, "https://queue.fal.run/minimax/h3/reference-to-video"],
		] as const)("keeps the provider model id intact (%s, %o)", async (authMethod, args, expected) => {
			expect(await urlFor(new FalAIImageTextToVideoTask(), REFERENCE_TO_VIDEO, authMethod, args)).toBe(expected);
		});
	});

	describe("image-text-to-image", () => {
		const providerId = "fal-ai/flux-2/edit";

		it("keeps the provider model id intact when routed through huggingface.co", async () => {
			expect(await urlFor(new FalAIImageTextToImageTask(), providerId, "hf-token", PROMPT_ONLY)).toBe(
				"https://router.huggingface.co/fal-ai/fal-ai/flux-2/edit?_subdomain=queue",
			);
		});

		it("drops the /edit segment when calling fal directly", async () => {
			expect(await urlFor(new FalAIImageTextToImageTask(), providerId, "provider-key", PROMPT_ONLY)).toBe(
				"https://queue.fal.run/fal-ai/flux-2",
			);
		});
	});
});

describe("fal-ai image-text-to-video payloads", () => {
	describe("reference-to-video endpoints", () => {
		// Verified live: the app rejects a reference-less call even though the schema only marks
		// `prompt` required, so fail with something actionable rather than a 422.
		it("rejects a call carrying no reference at all", async () => {
			await expect(bodyFor(REFERENCE_TO_VIDEO, PROMPT_ONLY)).rejects.toThrow("requires at least one reference");
		});

		it("leads the subject references with the task's own image input", async () => {
			expect(
				await bodyFor(REFERENCE_TO_VIDEO, {
					inputs: IMAGE,
					parameters: { prompt: "Image 1 next to Image 2", reference_images: ["https://example.com/2.png"] },
				}),
			).toStrictEqual({
				prompt: "Image 1 next to Image 2",
				reference_image_urls: ["data:image/png;base64,AQID", "https://example.com/2.png"],
			});
		});

		it("carries images, videos, audio and generation options in a single call", async () => {
			expect(
				await bodyFor(REFERENCE_TO_VIDEO, {
					parameters: {
						prompt: "Image 1 moves like Video 1 to Audio 1",
						reference_images: ["https://example.com/subject.png"],
						reference_videos: [new Blob([new Uint8Array([4])], { type: "video/mp4" })],
						reference_audio: [new Blob([new Uint8Array([5])], { type: "audio/mpeg" })],
						aspect_ratio: "9:16",
						resolution: "768P",
						duration: 10,
					},
				}),
			).toStrictEqual({
				prompt: "Image 1 moves like Video 1 to Audio 1",
				reference_image_urls: ["https://example.com/subject.png"],
				reference_video_urls: ["data:video/mp4;base64,BA=="],
				reference_audio_urls: ["data:audio/mpeg;base64,BQ=="],
				aspect_ratio: "9:16",
				resolution: "768P",
				duration: 10,
			});
		});

		it("builds loras from a tag-filter adapter mapping", async () => {
			expect(await bodyFor(REFERENCE_TO_VIDEO, WITH_IMAGE, "lora")).toStrictEqual({
				prompt: "a bee on a sunflower",
				reference_image_urls: ["data:image/png;base64,AQID"],
				loras: [
					{
						path: "https://huggingface.co/MiniMaxAI/MiniMax-H3/resolve/main/pytorch_lora_weights.safetensors",
						scale: 1,
					},
				],
			});
		});
	});

	// The mapped endpoint decides the payload shape, so a model still pointing at the plain
	// image-to-video endpoint keeps its single first-frame `image_url`.
	describe("image-to-video endpoints", () => {
		it("sends the image input as a single first frame", async () => {
			expect(
				await bodyFor(IMAGE_TO_VIDEO, {
					inputs: IMAGE,
					parameters: { prompt: "zoom out", end_image_url: "https://example.com/last.png" },
				}),
			).toStrictEqual({
				prompt: "zoom out",
				image_url: "data:image/png;base64,AQID",
				end_image_url: "https://example.com/last.png",
			});
		});

		it("sends a prompt-only call unchanged", async () => {
			expect(await bodyFor(IMAGE_TO_VIDEO, PROMPT_ONLY)).toStrictEqual({ prompt: "a bee on a sunflower" });
		});

		it("refuses references it cannot carry", async () => {
			await expect(
				bodyFor(IMAGE_TO_VIDEO, {
					inputs: IMAGE,
					parameters: { prompt: "p", reference_videos: ["https://example.com/v.mp4"] },
				}),
			).rejects.toThrow("accepts a single reference image and no reference video or audio");
		});
	});

	describe("reference validation", () => {
		const list = (n: number) => Array.from({ length: n }, (_, i) => `https://example.com/${i}`);

		it.each([
			[{ reference_images: list(10) }, "at most 9 entries in reference_image_urls"],
			[{ reference_videos: list(4) }, "at most 3 entries in reference_video_urls"],
			[{ reference_audio: list(4) }, "at most 3 entries in reference_audio_urls"],
			[
				{ reference_images: list(9), reference_videos: list(3), reference_audio: list(1) },
				"at most 12 reference files in total",
			],
			[{ reference_audio: list(1) }, "does not accept reference audio on its own"],
		])("rejects %o", async (parameters, message) => {
			await expect(bodyFor(REFERENCE_TO_VIDEO, { parameters: { prompt: "p", ...parameters } })).rejects.toThrow(
				message,
			);
		});
	});
});

// fal exposes `.../lora` variants of its video endpoints, and they require a `loras` entry. Only the
// image tasks built one before, so a tag-filter adapter mapping never reached the video ones.
describe("fal-ai text-to-video loras", () => {
	const preparePayload = (mapping?: Partial<InferenceProviderMappingEntry>) =>
		new FalAITextToVideoTask().preparePayload({
			args: { inputs: "a bee on a sunflower" },
			model: "minimax/h3/text-to-video",
			task: "text-to-video",
			mapping: mapping && {
				provider: "fal-ai",
				providerId: "minimax/h3/text-to-video/lora",
				hfModelId: "MiniMaxAI/MiniMax-H3",
				status: "live",
				task: "text-to-video",
				...mapping,
			},
		} as BodyParams);

	it("builds loras from a tag-filter adapter mapping", () => {
		expect(preparePayload({ adapter: "lora", adapterWeightsPath: "pytorch_lora_weights.safetensors" })).toStrictEqual({
			prompt: "a bee on a sunflower",
			loras: [
				{
					path: "https://huggingface.co/MiniMaxAI/MiniMax-H3/resolve/main/pytorch_lora_weights.safetensors",
					scale: 1,
				},
			],
		});
	});

	it("leaves the payload alone without an adapter", () => {
		expect(preparePayload()).toStrictEqual({ prompt: "a bee on a sunflower" });
	});
});
