import { describe, expect, it } from "vitest";
import { FalAITextToImageTask, FalAIImageToImageTask, FalAIImageTextToImageTask } from "../src/providers/fal-ai.js";
import { NscaleTextToImageTask } from "../src/providers/nscale.js";
import { ZaiTextToImageTask } from "../src/providers/zai-org.js";

/**
 * huggingface_hub maps the HF-inference `width`/`height` (and `target_size`) parameters onto each
 * provider's native resolution field; the JS client must do the same or the parameters are
 * silently ignored by the provider.
 */
describe("text-to-image resolution parameter mapping", () => {
	describe("fal-ai", () => {
		it("maps width+height to an image_size object", () => {
			const payload = new FalAITextToImageTask().preparePayload({
				args: { inputs: "a cat", parameters: { width: 512, height: 768, guidance_scale: 7 } },
			} as never);
			expect(payload.image_size).toEqual({ width: 512, height: 768 });
			expect(payload.width).toBeUndefined();
			expect(payload.height).toBeUndefined();
			expect(payload.prompt).toBe("a cat");
			expect(payload.guidance_scale).toBe(7);
		});

		it("keeps width/height untouched when only one is provided", () => {
			const payload = new FalAITextToImageTask().preparePayload({
				args: { inputs: "a cat", parameters: { width: 512 } },
			} as never);
			expect(payload.image_size).toBeUndefined();
			expect(payload.width).toBe(512);
		});
	});

	describe("fal-ai image-to-image", () => {
		it("renames target_size to image_size", async () => {
			const payload = await new FalAIImageToImageTask().preparePayloadAsync({
				inputs: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }),
				parameters: { target_size: { width: 512, height: 512 }, strength: 0.8 },
			} as never);
			expect((payload as Record<string, unknown>).image_size).toEqual({ width: 512, height: 512 });
			expect((payload as Record<string, unknown>).target_size).toBeUndefined();
			expect((payload as Record<string, unknown>).strength).toBe(0.8);
		});
	});

	describe("fal-ai image-text-to-image (prompt-only)", () => {
		it("renames target_size to image_size", async () => {
			const payload = await new FalAIImageTextToImageTask().preparePayloadAsync({
				parameters: { prompt: "a cat", target_size: { width: 512, height: 512 } },
			} as never);
			expect((payload as Record<string, unknown>).image_size).toEqual({ width: 512, height: 512 });
			expect((payload as Record<string, unknown>).target_size).toBeUndefined();
		});

		it("maps width+height to an image_size object", async () => {
			const payload = await new FalAIImageTextToImageTask().preparePayloadAsync({
				parameters: { prompt: "a cat", width: 512, height: 768 },
			} as never);
			expect((payload as Record<string, unknown>).image_size).toEqual({ width: 512, height: 768 });
			expect((payload as Record<string, unknown>).width).toBeUndefined();
			expect((payload as Record<string, unknown>).height).toBeUndefined();
		});
	});

	describe("nscale", () => {
		it("maps width+height to a size string and drops unsupported parameters", () => {
			const payload = new NscaleTextToImageTask().preparePayload({
				args: {
					inputs: "a cat",
					parameters: { width: 512, height: 768, num_inference_steps: 30, cfg_scale: 7, seed: 42 },
				},
				model: "stabilityai/stable-diffusion-xl-base-1.0",
			} as never);
			expect(payload.size).toBe("512x768");
			expect(payload.width).toBeUndefined();
			expect(payload.height).toBeUndefined();
			expect(payload.num_inference_steps).toBeUndefined();
			expect(payload.cfg_scale).toBeUndefined();
			expect(payload.seed).toBe(42);
			expect(payload.prompt).toBe("a cat");
		});
	});

	describe("zai-org", () => {
		it("maps width+height to a size string", () => {
			const payload = new ZaiTextToImageTask().preparePayload({
				args: { inputs: "a cat", parameters: { width: 512, height: 768 } },
				model: "cogview-3-flash",
			} as never);
			expect(payload.size).toBe("512x768");
			expect(payload.width).toBeUndefined();
			expect(payload.height).toBeUndefined();
			expect(payload.prompt).toBe("a cat");
		});

		it("drops a lone width or height without producing a size", () => {
			const payload = new ZaiTextToImageTask().preparePayload({
				args: { inputs: "a cat", parameters: { width: 512 } },
				model: "cogview-3-flash",
			} as never);
			expect(payload.size).toBeUndefined();
			expect(payload.width).toBeUndefined();
		});
	});
});
