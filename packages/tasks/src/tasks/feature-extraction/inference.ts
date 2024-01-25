
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Using src/scripts/inference-codegen
 */


/**
 * Inputs for Text Embedding inference
 */
export interface FeatureExtractionInput {
    /**
     * The text to get the embeddings of
     */
    input: string;
    /**
     * Additional inference parameters
     */
    parameters?: { [key: string]: unknown };
    [property: string]: unknown;
}
