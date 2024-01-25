/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Translation inference
 *
 * Inputs for Text2text Generation inference
 */
export interface TranslationInput {
	/**
	 * The input text data
	 */
	data: string;
	/**
	 * Additional inference parameters
	 */
	parameters?: Text2TextGenerationParameters;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Text2text Generation
 */
export interface Text2TextGenerationParameters {
	/**
	 * Whether to clean up the potential extra spaces in the text output.
	 */
	cleanUpTokenizationSpaces?: boolean;
	/**
	 * Additional parametrization of the text generation algorithm
	 */
	generateParameters?: { [key: string]: unknown };
	/**
	 * The truncation strategy to use
	 */
	truncation?: Text2TextGenerationTruncationStrategy;
	[property: string]: unknown;
}

export type Text2TextGenerationTruncationStrategy = "do_not_truncate" | "longest_first" | "only_first" | "only_second";

/**
 * Outputs for Translation inference
 *
 * Outputs of inference for the Text2text Generation task
 */
export interface TranslationOutput {
	/**
	 * The generated text.
	 */
	generatedText: string;
	[property: string]: unknown;
}
