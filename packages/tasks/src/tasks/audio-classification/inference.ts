
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Generated on 2024-01-19T14:59:10.562Z
 */


/**
 * Inputs for Audio Classification inference
 */
export interface AudioClassificationInput {
    /**
     * On or several audio files to classify
     */
    inputs: any;
    /**
     * Additional inference parameters
     */
    parameters?: AudioClassificationParameters;
    [property: string]: any;
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
    [property: string]: any;
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
    [property: string]: any;
}
