
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Using src/scripts/inference-codegen
 */


/**
 * Inputs for Feature Extraction inference
 */
export interface FeatureExtractionInput {
    /**
     * One or several texts to get the features of
     */
    inputs: string[] | string;
    /**
     * Additional inference parameters
     */
    parameters?: { [key: string]: unknown };
    [property: string]: unknown;
}
