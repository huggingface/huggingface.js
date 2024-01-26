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
	 * The input image data
	 */
	data: unknown;
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
export type ImageToTextOutput = ImageToTextOutputElement[];
/**
 * Outputs of inference for the Image To Text task
 */
export interface ImageToTextOutputElement {
	/**
	 * The generated text.
	 */
	generatedText: string;
	[property: string]: unknown;
}
