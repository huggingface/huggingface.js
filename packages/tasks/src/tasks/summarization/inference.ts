/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Summarization inference
 */
export type SummarizationInput = unknown[] | boolean | number | number | null | SummarizationInputObject | string;

export interface SummarizationInputObject {
	/**
	 * The text to summarize.
	 */
	inputs: string;
	[property: string]: unknown;
}

/**
 * Outputs of inference for the Summarization task
 */
export interface SummarizationOutput {
	/**
	 * The summarized text.
	 */
	summary_text: string;
	[property: string]: unknown;
}
