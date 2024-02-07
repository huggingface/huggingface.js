/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */
/**
 * Inputs for Text Classification inference
 */
export interface TextClassificationInput {
	/**
	 * The text to classify
	 */
	inputs: string;
	/**
	 * Additional inference parameters
	 */
	parameters?: TextClassificationParameters;
	[property: string]: unknown;
}
/**
 * Additional inference parameters
 *
 * Additional inference parameters for Text Classification
 */
export interface TextClassificationParameters {
	functionToApply?: ClassificationOutputTransform;
	/**
	 * When specified, limits the output to the top K most probable classes.
	 */
	topK?: number;
	[property: string]: unknown;
}
/**
 * The function to apply to the model outputs in order to retrieve the scores.
 */
export type ClassificationOutputTransform = "sigmoid" | "softmax" | "none";
export type TextClassificationOutput = TextClassificationOutputElement[];
/**
 * Outputs of inference for the Text Classification task
 */
export interface TextClassificationOutputElement {
	/**
	 * The predicted class label.
	 */
	label: string;
	/**
	 * The corresponding probability.
	 */
	score: number;
	[property: string]: unknown;
}
