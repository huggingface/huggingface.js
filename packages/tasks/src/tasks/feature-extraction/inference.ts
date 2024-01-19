/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Generated on 2024-01-19T16:16:01.752Z
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
	parameters?: { [key: string]: any };
	[property: string]: any;
}
