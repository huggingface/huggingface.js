/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

export interface FeatureExtractionOutput { [key: string]: unknown }

/**
 * Feature Extraction Input.
 *
 * Auto-generated from TEI specs.
 * For more details, check out
 * https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/scripts/inference-tei-import.ts.
 */
export interface FeatureExtractionInput {
	inputs: FeatureExtractionInputInput;
	normalize?: boolean;
	truncate?: boolean;
	[property: string]: unknown;
}

export type FeatureExtractionInputInput = string[] | string;
