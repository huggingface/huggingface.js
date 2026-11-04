/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */
/**
 * Inputs for Video To Video inference
 */
export interface VideoToVideoInput {
	/**
	 * The input video data as a base64-encoded string. If no `parameters` are provided, you can
	 * also provide the video data as a raw bytes payload.
	 */
	inputs: Blob;
	/**
	 * Additional inference parameters for Video To Video
	 */
	parameters?: VideoToVideoParameters;
	[property: string]: unknown;
}
/**
 * Additional inference parameters for Video To Video
 */
export interface VideoToVideoParameters {
	/**
	 * For diffusion models. A higher guidance scale value encourages the model to generate
	 * videos closely linked to the text prompt at the expense of lower video quality.
	 */
	guidance_scale?: number;
	/**
	 * One prompt to guide what NOT to include in video generation.
	 */
	negative_prompt?: string;
	/**
	 * The num_frames parameter determines how many video frames are generated.
	 */
	num_frames?: number;
	/**
	 * The number of denoising steps. More denoising steps usually lead to a higher quality
	 * video at the expense of slower inference.
	 */
	num_inference_steps?: number;
	/**
	 * The text prompt to guide the video generation.
	 */
	prompt?: string;
	/**
	 * Seed for the random number generator.
	 */
	seed?: number;
	/**
	 * The size in pixel of the output video frames.
	 */
	target_size?: TargetSize;
	[property: string]: unknown;
}
/**
 * The size in pixel of the output video frames.
 */
export interface TargetSize {
	height: number;
	width: number;
	[property: string]: unknown;
}
/**
 * Outputs of inference for the Video To Video task
 */
export interface VideoToVideoOutput {
	/**
	 * The generated video returned as raw bytes in the payload.
	 */
	video: unknown;
	[property: string]: unknown;
}
