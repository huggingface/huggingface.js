/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

export type ImageFeatureExtractionOutput = unknown[];

/**
 * Inputs for Image Feature Extraction
 */
export interface ImageFeatureExtractionInput {
	/**
	 * The input image data
	 */
	inputs: unknown;
	/**
	 * Additional inference parameters
	 */
	parameters?: { [key: string]: unknown };
	[property: string]: unknown;
}
