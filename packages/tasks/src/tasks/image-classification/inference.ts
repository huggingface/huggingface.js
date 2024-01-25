
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Using src/scripts/inference-codegen
 */


/**
 * Inputs for Image Classification inference
 */
export interface ImageClassificationInput {
    /**
     * The input image data
     */
    input: unknown;
    /**
     * Additional inference parameters
     */
    parameters?: ImageClassificationParameters;
    [property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Image Classification
 */
export interface ImageClassificationParameters {
    /**
     * The function to apply to the model outputs in order to retrieve the scores.
     */
    functionToApply?: ImageClassificationOutputTransform;
    /**
     * When specified, limits the output to the top K most probable classes.
     */
    topK?: number;
    [property: string]: unknown;
}

export type ImageClassificationOutputTransform = "sigmoid" | "softmax" | "none";

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
    [property: string]: unknown;
}
