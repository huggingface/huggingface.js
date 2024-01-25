
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
     * The input text data, with candidate labels
     */
    input: InputObject;
    /**
     * Additional inference parameters
     */
    parameters?: ZeroShotClassificationParameters;
    [property: string]: unknown;
}

/**
 * The input text data, with candidate labels
 */
export interface InputObject {
    /**
     * The set of possible class labels to classify the text into.
     */
    candidateLabels: string[];
    /**
     * The text to classify
     */
    text: string;
    [property: string]: unknown;
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
    [property: string]: unknown;
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
    [property: string]: unknown;
}
