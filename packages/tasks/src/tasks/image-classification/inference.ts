/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Generated on 2024-01-19T16:16:01.752Z
 */

/**
 * Inputs for Image Classification inference
 */
export interface ImageClassificationInput {
	/**
	 * On or several image files to classify
	 */
	inputs: any;
	/**
	 * Additional inference parameters
	 */
	parameters?: ImageClassificationParameters;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Image Classification
 */
export interface ImageClassificationParameters {
	/**
	 * When specified, limits the output to the top K most probable classes.
	 */
	topK?: number;
	[property: string]: any;
}

/**
 * Outputs of inference for the Image Classification task
 */
export interface ImageClassificationOutput {
	/**
	 * The predicted class label (model specific).
	 */
	label: string;
	/**
	 * The corresponding probability.
	 */
	score: number;
	[property: string]: any;
}
