/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Video Classification inference
 */
export interface VideoClassificationInput {
	/**
	 * One or several videos to be classified
	 */
	inputs: unknown;
	/**
	 * Additional inference parameters
	 */
	parameters?: VideoClassificationParameters;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Video Classification
 */
export interface VideoClassificationParameters {
	/**
	 * The sampling rate used to select frames from the video.
	 */
	frameSamplingRate?: number;
	/**
	 * The number of sampled frames to consider for classification.
	 */
	numFrames?: number;
	/**
	 * When specified, limits the output to the top K most probable classes.
	 */
	topK?: number;
	[property: string]: unknown;
}

/**
 * Outputs of inference for the Video Classification task
 */
export interface VideoClassificationOutput {
	/**
	 * The predicted class label (model specific).
	 */
	label: string;
	/**
	 * The corresponding probability.
	 */
	score: number;
	[property: string]: unknown;
}
