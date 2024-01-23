/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Image To Text inference
 */
export interface ImageToTextInput {
	/**
	 * One or several images to generated text for
	 */
	inputs: unknown;
	/**
	 * Additional inference parameters
	 */
	parameters?: ImageToTextParameters;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Image To Text
 */
export interface ImageToTextParameters {
	/**
	 * The amount of maximum tokens to generate.
	 */
	maxNewTokens?: number;
	[property: string]: unknown;
}

/**
 * Outputs of inference for the Image To Text task
 */
export interface ImageToTextOutput {
	/**
	 * The generated text.
	 */
	generatedText: string;
	[property: string]: unknown;
}
