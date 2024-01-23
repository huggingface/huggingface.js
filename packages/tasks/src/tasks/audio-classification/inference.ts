
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
     * On or several audio files to classify
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
    /**
     * When specified, limits the output to the top K most probable classes.
     */
    topK?: number;
    [property: string]: unknown;
}

/**
 * Outputs for Audio Classification inference
 */
export interface AudioClassificationOutput {
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
