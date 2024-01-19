/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Generated on 2024-01-19T16:16:01.752Z
 */

/**
 * Inputs for Zero Shot Image Classification inference
 */
export interface ZeroShotImageClassificationInput {
	/**
	 * One or several images to classify
	 */
	inputs: ZeroShotImageClassificationInputElement[] | ZeroShotImageClassificationInputElement;
	/**
	 * Additional inference parameters
	 */
	parameters?: ZeroShotImageClassificationParameters;
	[property: string]: any;
}

export interface ZeroShotImageClassificationInputElement {
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
