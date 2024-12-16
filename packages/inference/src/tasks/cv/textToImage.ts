import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TextToImageArgs = BaseArgs & {
	/**
	 * The text to generate an image from
	 */
	inputs: string;

	/**
	 * Same param but for external providers like Together
	 */
	prompt?: string;
	response_format?: "base64";

	parameters?: {
		/**
		 * An optional negative prompt for the image generation
		 */
		negative_prompt?: string;
		/**
		 * The height in pixels of the generated image
		 */
		height?: number;
		/**
		 * The width in pixels of the generated image
		 */
		width?: number;
		/**
		 * The number of denoising steps. More denoising steps usually lead to a higher quality image at the expense of slower inference.
		 */
		num_inference_steps?: number;
		/**
		 * Guidance scale: Higher guidance scale encourages to generate images that are closely linked to the text `prompt`, usually at the expense of lower image quality.
		 */
		guidance_scale?: number;
	};
};

interface Base64ImageGeneration {
	id: string;
	model: string;
	data: Array<{
		b64_json: string;
	}>;
}
export type TextToImageOutput = Blob;

/**
 * This task reads some text input and outputs an image.
 * Recommended model: stabilityai/stable-diffusion-2
 */
export async function textToImage(args: TextToImageArgs, options?: Options): Promise<TextToImageOutput> {
	if (args.provider === "together") {
		args.prompt = args.inputs;
		args.inputs = "";
		args.response_format = "base64";
	}
	const res = await request<TextToImageOutput | Base64ImageGeneration>(args, {
		...options,
		taskHint: "text-to-image",
	});
	if (res && typeof res === "object" && Array.isArray(res.data) && res.data[0].b64_json) {
		const base64Data = res.data[0].b64_json;
		const base64Response = await fetch(`data:image/jpeg;base64,${base64Data}`);
		const blob = await base64Response.blob();
		return blob;
	}
	const isValidOutput = res && res instanceof Blob;
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Blob");
	}
	return res;
}
