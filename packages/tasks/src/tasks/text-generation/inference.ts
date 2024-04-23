/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Text Generation Input.
 *
 * Auto-generated from TGI specs.
 * For more details, check out
 * https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/scripts/inference-tgi-import.ts.
 */
export interface TextGenerationInput {
	inputs: string;
	parameters?: TextGenerationInputGenerateParameters;
	stream?: boolean;
	[property: string]: unknown;
}

export interface TextGenerationInputGenerateParameters {
	best_of?: number;
	decoder_input_details?: boolean;
	details?: boolean;
	do_sample?: boolean;
	frequency_penalty?: number;
	grammar?: TextGenerationInputGrammarType;
	max_new_tokens?: number;
	repetition_penalty?: number;
	return_full_text?: boolean;
	seed?: number;
	stop?: string[];
	temperature?: number;
	top_k?: number;
	top_n_tokens?: number;
	top_p?: number;
	truncate?: number;
	typical_p?: number;
	watermark?: boolean;
	[property: string]: unknown;
}

export interface TextGenerationInputGrammarType {
	type: Type;
	/**
	 * A string that represents a [JSON Schema](https://json-schema.org/).
	 *
	 * JSON Schema is a declarative language that allows to annotate JSON documents
	 * with types and descriptions.
	 */
	value: unknown;
	[property: string]: unknown;
}

export type Type = "json" | "regex";

/**
 * Text Generation Output.
 *
 * Auto-generated from TGI specs.
 * For more details, check out
 * https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/scripts/inference-tgi-import.ts.
 */
export interface TextGenerationOutput {
	details?: TextGenerationOutputDetails;
	generated_text: string;
	[property: string]: unknown;
}

export interface TextGenerationOutputDetails {
	best_of_sequences?: TextGenerationOutputBestOfSequence[];
	finish_reason: TextGenerationOutputFinishReason;
	generated_tokens: number;
	prefill: TextGenerationOutputPrefillToken[];
	seed?: number;
	tokens: TextGenerationOutputToken[];
	top_tokens?: Array<TextGenerationOutputToken[]>;
	[property: string]: unknown;
}

export interface TextGenerationOutputBestOfSequence {
	finish_reason: TextGenerationOutputFinishReason;
	generated_text: string;
	generated_tokens: number;
	prefill: TextGenerationOutputPrefillToken[];
	seed?: number;
	tokens: TextGenerationOutputToken[];
	top_tokens?: Array<TextGenerationOutputToken[]>;
	[property: string]: unknown;
}

export type TextGenerationOutputFinishReason = "length" | "eos_token" | "stop_sequence";

export interface TextGenerationOutputPrefillToken {
	id: number;
	logprob: number;
	text: string;
	[property: string]: unknown;
}

export interface TextGenerationOutputToken {
	id: number;
	logprob: number;
	special: boolean;
	text: string;
	[property: string]: unknown;
}

/**
 * Text Generation Stream Output.
 *
 * Auto-generated from TGI specs.
 * For more details, check out
 * https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/scripts/inference-tgi-import.ts.
 */
export interface TextGenerationStreamOutput {
	details?: TextGenerationStreamOutputStreamDetails;
	generated_text?: string;
	index: number;
	token: TextGenerationStreamOutputToken;
	top_tokens?: TextGenerationStreamOutputToken[];
	[property: string]: unknown;
}

export interface TextGenerationStreamOutputStreamDetails {
	finish_reason: TextGenerationOutputFinishReason;
	generated_tokens: number;
	seed?: number;
	[property: string]: unknown;
}

export interface TextGenerationStreamOutputToken {
	id: number;
	logprob: number;
	special: boolean;
	text: string;
	[property: string]: unknown;
}
