import { describe, expect, it } from "vitest";
import { FalAIImageTextToVideoTask } from "../src/providers/fal-ai.js";
import { ReplicateImageTextToVideoTask } from "../src/providers/replicate.js";
import { WavespeedAIImageTextToVideoTask } from "../src/providers/wavespeed.js";
import type { BodyParams, InferenceTask, RequestArgs } from "../src/types.js";

interface Helper {
	preparePayloadAsync(args: never): Promise<RequestArgs>;
	preparePayload(params: BodyParams): Record<string, unknown>;
}

const blob = (type: string, byte: number) => new Blob([new Uint8Array([byte])], { type });

/** One task-level call, carrying every modality. Nothing in it names a provider. */
const EVERY_MODALITY = {
	inputs: blob("image/png", 1),
	parameters: {
		prompt: "Image 1 moves like Video 1, synced to Audio 1",
		reference_images: ["https://example.com/style.png"],
		reference_videos: [blob("video/mp4", 2)],
		reference_audio: [blob("audio/wav", 3)],
		duration: 6,
	},
};

async function bodyFor(
	helper: Helper,
	provider: string,
	providerId: string,
	args: Record<string, unknown>,
	task: InferenceTask = "image-text-to-video",
): Promise<Record<string, unknown>> {
	const prepared = await helper.preparePayloadAsync(args as never);
	return helper.preparePayload({
		args: prepared as Record<string, unknown>,
		model: providerId,
		task,
		mapping: { provider, providerId, hfModelId: "MiniMaxAI/MiniMax-H3", status: "live", task },
	} as BodyParams);
}

// Every provider names and bounds these differently; the task does not, so the same call has to
// reach each of them in its own vocabulary.
describe("image-text-to-video reference inputs", () => {
	it("fal-ai carries them as reference_*_urls, with the primary image leading", async () => {
		expect(
			await bodyFor(new FalAIImageTextToVideoTask(), "fal-ai", "minimax/h3/reference-to-video", EVERY_MODALITY),
		).toMatchObject({
			prompt: EVERY_MODALITY.parameters.prompt,
			duration: 6,
			reference_image_urls: ["data:image/png;base64,AQ==", "https://example.com/style.png"],
			reference_video_urls: ["data:video/mp4;base64,Ag=="],
			// fal's data-URL decoder needs audio/wav remapped to a type it can place.
			reference_audio_urls: ["data:audio/x-wav;base64,Aw=="],
		});
	});

	it("wavespeed carries them as reference_images / videos / audios", async () => {
		const body = await bodyFor(
			new WavespeedAIImageTextToVideoTask(),
			"wavespeed",
			"wavespeed-ai/minimax-h3/reference-to-video",
			EVERY_MODALITY,
		);
		expect(body).toMatchObject({
			prompt: EVERY_MODALITY.parameters.prompt,
			reference_images: ["data:image/png;base64,AQ==", "https://example.com/style.png"],
			reference_videos: ["data:video/mp4;base64,Ag=="],
			reference_audios: ["data:audio/wav;base64,Aw=="],
		});
		// This endpoint has no first frame — the primary image is just the first subject reference.
		expect(body).not.toHaveProperty("image");
		expect(body).not.toHaveProperty("images");
	});

	it("replicate keeps the first frame beside the references, in one schema", async () => {
		const { input } = (await bodyFor(
			new ReplicateImageTextToVideoTask(),
			"replicate",
			"minimax/h3",
			EVERY_MODALITY,
		)) as { input: Record<string, unknown> };
		expect(input).toMatchObject({
			prompt: EVERY_MODALITY.parameters.prompt,
			first_frame_image: "data:image/png;base64,AQ==",
			reference_image_urls: ["https://example.com/style.png"],
			reference_video_urls: ["data:video/mp4;base64,Ag=="],
			reference_audio_urls: ["data:audio/wav;base64,Aw=="],
		});
	});

	// Offered on every image-text-to-video model, so an endpoint that cannot use them has to say so
	// rather than ship a body full of keys it will ignore.
	it.each([
		["fal-ai", new FalAIImageTextToVideoTask(), "minimax/h3/image-to-video", "accepts a single reference image"],
		[
			"wavespeed",
			new WavespeedAIImageTextToVideoTask(),
			"wavespeed-ai/minimax-h3/image-to-video",
			"does not accept reference inputs",
		],
	])("%s refuses references its endpoint cannot honour", async (provider, helper, providerId, message) => {
		await expect(bodyFor(helper as Helper, provider, providerId, EVERY_MODALITY)).rejects.toThrow(message);
	});

	describe("limits are the provider's, the error names the task's field", () => {
		const list = (n: number) => Array.from({ length: n }, (_, i) => `https://example.com/${i}`);
		const fal = () => new FalAIImageTextToVideoTask();
		const REF = "minimax/h3/reference-to-video";

		it.each([
			[{ reference_images: list(10) }, "at most 9 entries in reference_images"],
			[{ reference_videos: list(4) }, "at most 3 entries in reference_videos"],
			[{ reference_audio: list(4) }, "at most 3 entries in reference_audio"],
			[
				{ reference_images: list(9), reference_videos: list(3), reference_audio: list(1) },
				"at most 12 reference files in total",
			],
			[{ reference_audio: list(1) }, "does not accept reference audio on its own"],
		])("rejects %o", async (parameters, message) => {
			await expect(bodyFor(fal(), "fal-ai", REF, { parameters: { prompt: "p", ...parameters } })).rejects.toThrow(
				message,
			);
		});

		it("applies no combined cap where the provider declares none", async () => {
			const body = await bodyFor(new ReplicateImageTextToVideoTask(), "replicate", "minimax/h3", {
				parameters: { prompt: "p", reference_images: list(9), reference_videos: list(3), reference_audio: list(3) },
			});
			expect((body as { input: Record<string, string[]> }).input.reference_image_urls).toHaveLength(9);
		});
	});
});
