/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

export type ImageToImageOutput = unknown[];

/**
 * Inputs for Image To Image inference
 */
export interface ImageToImageInput {
	/**
	 * One or more images to generate images from
	 */
	inputs: unknown;
	/**
	 * Additional inference parameters
	 */
	parameters?: unknown;
	[property: string]: unknown;
}
