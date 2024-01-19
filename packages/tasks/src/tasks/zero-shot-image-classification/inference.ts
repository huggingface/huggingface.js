/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Zero Shot Image Classification inference
 */
export interface ZeroShotImageClassificationInput {
	/**
	 * One or several images to classify
	 */
	inputs: ZeroShotImageClassificationInputSingle[] | ZeroShotImageClassificationInputSingle;
	/**
	 * Additional inference parameters
	 */
	parameters?: ZeroShotImageClassificationParameters;
	[property: string]: any;
}

export interface ZeroShotImageClassificationInputSingle {
	/**
	 * The candidate labels for this image
	 */
	candidateLabels: string[];
	/**
	 * The image data to classify
	 */
	image: any;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Zero Shot Image Classification
 */
export interface ZeroShotImageClassificationParameters {
	/**
	 * The sentence used in conjunction with candidateLabels to attempt the text classification
	 * by replacing the placeholder with the candidate labels.
	 */
	hypothesisTemplate?: string;
	[property: string]: any;
}

/**
 * Outputs of inference for the Zero Shot Image Classification task
 */
export interface ZeroShotImageClassificationOutput {
	/**
	 * A candidate label
	 */
	label: string;
	/**
	 * The associated score / probability
	 */
	score: number;
	[property: string]: any;
}
