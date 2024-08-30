/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Text To Image inference
 */
export interface TextToImageInput {
	/**
	 * The input text data (sometimes called "prompt")
	 */
	inputs: string;
	/**
	 * Additional inference parameters
	 */
	parameters?: TextToImageParameters;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Text To Image
 */
export interface TextToImageParameters {
	/**
	 * For diffusion models. A higher guidance scale value encourages the model to generate
	 * images closely linked to the text prompt at the expense of lower image quality.
	 */
	guidance_scale?: number;
	/**
	 * One or several prompt to guide what NOT to include in image generation.
	 */
	negative_prompt?: string[];
	/**
	 * For diffusion models. The number of denoising steps. More denoising steps usually lead to
	 * a higher quality image at the expense of slower inference.
	 */
	num_inference_steps?: number;
	/**
	 * For diffusion models. Override the scheduler with a compatible one
	 */
	scheduler?: string;
	/**
	 * The size in pixel of the output image
	 */
	target_size?: TargetSize;
	[property: string]: unknown;
}

/**
 * The size in pixel of the output image
 */
export interface TargetSize {
	height: number;
	width: number;
	[property: string]: unknown;
}

/**
 * Outputs of inference for the Text To Image task
 */
export interface TextToImageOutput {
	/**
	 * The generated image returned as raw bytes in the payload.
	 */
	image: unknown;
	[property: string]: unknown;
}
