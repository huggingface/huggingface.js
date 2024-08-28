/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Translation inference
 */
export type TranslationInput = unknown[] | boolean | number | number | null | TranslationInputObject | string;

export interface TranslationInputObject {
	/**
	 * The text to translate.
	 */
	inputs: string;
	/**
	 * Additional inference parameters
	 */
	parameters?: TranslationParameters;
	[property: string]: unknown;
}

/**
 * Additional inference parameters
 *
 * Additional inference parameters for Translation
 */
export interface TranslationParameters {
	/**
	 * The source language of the text. Required for models that can translate from multiple
	 * languages.
	 */
	src_lang?: string;
	/**
	 * Target language to translate to. Required for models that can translate to multiple
	 * languages.
	 */
	tgt_lang?: string;
	[property: string]: unknown;
}

/**
 * Outputs of inference for the Translation task
 */
export interface TranslationOutput {
	/**
	 * The translated text.
	 */
	translation_text: string;
	[property: string]: unknown;
}
