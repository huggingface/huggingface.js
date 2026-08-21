import { describe, expect, it } from "vitest";
import { FalAIImageTextToImageTask, FalAIImageTextToVideoTask } from "../src/providers/fal-ai.js";
import type { AuthMethod } from "../src/types.js";

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

const PROMPT_ONLY = { parameters: { prompt: "a bee on a sunflower" } };
const WITH_IMAGE = { inputs: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), ...PROMPT_ONLY };

describe("fal-ai request URLs", () => {
	describe("image-text-to-video", () => {
		const providerId = "minimax/h3/image-to-video";

		it("keeps the provider model id intact when routed through huggingface.co", async () => {
			// The router resolves the mapping from the URL path, so dropping a segment makes the model
			// unresolvable ("Model not supported by provider fal-ai").
			expect(await urlFor(new FalAIImageTextToVideoTask(), providerId, "hf-token", PROMPT_ONLY)).toBe(
				"https://router.huggingface.co/fal-ai/minimax/h3/image-to-video?_subdomain=queue",
			);
		});

		it("keeps it intact when calling fal directly too", async () => {
			// The rewrite this used to do assumed the text-only variant sits at the parent path, as it
			// does for `fal-ai/flux-2/edit`. MiniMax-H3 has no endpoint at `minimax/h3`, and both of its
			// mapped endpoints already take a prompt-only call, so there is nothing to rewrite.
			expect(await urlFor(new FalAIImageTextToVideoTask(), providerId, "provider-key", PROMPT_ONLY)).toBe(
				"https://queue.fal.run/minimax/h3/image-to-video",
			);
		});

		it("never rewrites the URL when an image is provided", async () => {
			expect(await urlFor(new FalAIImageTextToVideoTask(), providerId, "hf-token", WITH_IMAGE)).toBe(
				"https://router.huggingface.co/fal-ai/minimax/h3/image-to-video?_subdomain=queue",
			);
			expect(await urlFor(new FalAIImageTextToVideoTask(), providerId, "provider-key", WITH_IMAGE)).toBe(
				"https://queue.fal.run/minimax/h3/image-to-video",
			);
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
