
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Using src/scripts/inference-codegen
 */


export type DepthEstimationOutput = unknown[];

/**
 * Inputs for Depth Estimation inference
 */
export interface DepthEstimationInput {
    /**
     * The input image data
     */
    inputs: unknown;
    /**
     * Additional inference parameters
     */
    parameters?: DepthEstimationParameters;
    [property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Depth Estimation
 */
export interface DepthEstimationParameters {
    /**
     * When specified, limits the output to the top K most probable classes.
     */
    topK?: number;
    [property: string]: unknown;
}
