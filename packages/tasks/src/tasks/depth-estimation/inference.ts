/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Depth Estimation inference
 */
export interface DepthEstimationInput {
	/**
	 * The input image data
	 */
	inputs: any;
	/**
	 * Additional inference parameters
	 */
	parameters?: DepthEstimationParameters;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Depth Estimation
 */
export interface DepthEstimationParameters {
	/**
	 * When specified, limits the output to the top K most probable classes.
	 */
	topK?: number;
	[property: string]: any;
}
