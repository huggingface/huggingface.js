/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */
/**
 * Inputs for Audio Classification inference
 */
export interface AudioClassificationInput {
	/**
	 * The input audio data
	 */
	inputs: unknown;
	/**
	 * Additional inference parameters
	 */
	parameters?: AudioClassificationParameters;
	[property: string]: unknown;
}
/**
 * Additional inference parameters
 *
 * Additional inference parameters for Audio Classification
 */
export interface AudioClassificationParameters {
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
export type AudioClassificationOutput = AudioClassificationOutputElement[];
/**
 * Outputs for Audio Classification inference
 */
export interface AudioClassificationOutputElement {
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
