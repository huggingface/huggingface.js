import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options, RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
import { request } from "../custom/request";

export type ImageToImageArgs = BaseArgs & {
	/**
	 * The initial image condition
	 *
	 **/
	inputs: Blob | ArrayBuffer;

	parameters?: {
		/**
		 * The text prompt to guide the image generation.
		 */
		prompt?: string;
		/**
		 * strengh param only works for SD img2img and alt diffusion img2img models
		 * Conceptually, indicates how much to transform the reference `image`. Must be between 0 and 1. `image`
		 * will be used as a starting point, adding more noise to it the larger the `strength`. The number of
		 * denoising steps depends on the amount of noise initially added. When `strength` is 1, added noise will
		 * be maximum and the denoising process will run for the full number of iterations specified in
		 * `num_inference_steps`. A value of 1, therefore, essentially ignores `image`.
		 **/
		strength?: number;
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
		/**
		 * guess_mode only works for ControlNet models, defaults to False In this mode, the ControlNet encoder will try best to recognize the content of the input image even if
		 * you remove all prompts. The `guidance_scale` between 3.0 and 5.0 is recommended.
		 */
		guess_mode?: boolean;
	};
};

export type ImageToImageOutput = Blob;

/**
 * This task reads some text input and outputs an image.
 * Recommended model: lllyasviel/sd-controlnet-depth
 */
export async function imageToImage(args: ImageToImageArgs, options?: Options): Promise<ImageToImageOutput> {
	let reqArgs: RequestArgs;
	if (!args.parameters) {
		reqArgs = {
			accessToken: args.accessToken,
			model: args.model,
			data: args.inputs,
		};
	} else {
		reqArgs = {
			...args,
			inputs: base64FromBytes(
				new Uint8Array(args.inputs instanceof ArrayBuffer ? args.inputs : await args.inputs.arrayBuffer())
			),
		};
	}
	const res = await request<ImageToImageOutput>(reqArgs, {
		...options,
		taskHint: "image-to-image",
	});
	const isValidOutput = res && res instanceof Blob;
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Blob");
	}
	return res;
}
