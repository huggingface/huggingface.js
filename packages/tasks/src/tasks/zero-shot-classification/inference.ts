/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Zero Shot Classification inference
 */
export interface ZeroShotClassificationInput {
	/**
	 * One or several text + candidate labels pairs to classify
	 */
	inputs: ZeroShotClassificationInputElement[] | ZeroShotClassificationInputElement;
	/**
	 * Additional inference parameters
	 */
	parameters?: ZeroShotClassificationParameters;
	[property: string]: any;
}

export interface ZeroShotClassificationInputElement {
	/**
	 * The set of possible class labels to classify the text into.
	 */
	candidateLabels: string[];
	/**
	 * The text to classify
	 */
	text: string;
	[property: string]: any;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Zero Shot Classification
 */
export interface ZeroShotClassificationParameters {
	/**
	 * The sentence used in conjunction with candidateLabels to attempt the text classification
	 * by replacing the placeholder with the candidate labels.
	 */
	hypothesisTemplate?: string;
	/**
	 * Whether multiple candidate labels can be true. If false, the scores are normalized such
	 * that the sum of the label likelihoods for each sequence is 1. If true, the labels are
	 * considered independent and probabilities are normalized for each candidate.
	 */
	multiLabel?: boolean;
	[property: string]: any;
}

/**
 * Outputs of inference for the Zero Shot Classification task
 */
export interface ZeroShotClassificationOutput {
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
