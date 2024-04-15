/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Text Generation Input
 */
export interface TextGenerationInput {
	inputs: string;
	parameters?: Parameters;
	[property: string]: unknown;
}

export interface Parameters {
	best_of?: number;
	decoder_input_details?: boolean;
	details?: boolean;
	do_sample?: boolean;
	frequency_penalty?: number;
	grammar?: Grammar;
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

export interface Grammar {
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
 * Text Generation Output
 */
export interface TextGenerationOutput {
	details?: TextGenerationOutputDetails;
	generated_text: string;
	[property: string]: unknown;
}

export interface TextGenerationOutputDetails {
	best_of_sequences?: BestOfSequenceElement[];
	finish_reason: FinishReason;
	generated_tokens: number;
	prefill: PrefillElement[];
	seed?: number;
	tokens: TokenElement[];
	top_tokens?: Array<TokenElement[]>;
	[property: string]: unknown;
}

export interface BestOfSequenceElement {
	finish_reason: FinishReason;
	generated_text: string;
	generated_tokens: number;
	prefill: PrefillElement[];
	seed?: number;
	tokens: TokenElement[];
	top_tokens?: Array<TokenElement[]>;
	[property: string]: unknown;
}

export type FinishReason = "length" | "eos_token" | "stop_sequence";

export interface PrefillElement {
	id: number;
	logprob: number;
	text: string;
	[property: string]: unknown;
}

export interface TokenElement {
	id: number;
	logprob: number;
	special: boolean;
	text: string;
	[property: string]: unknown;
}

/**
 * Text Generation Stream Output
 */
export interface TextGenerationStreamOutput {
	details?: TextGenerationStreamOutputDetails;
	generated_text?: string;
	index: number;
	token: Token;
	top_tokens?: Token[];
	[property: string]: unknown;
}

export interface TextGenerationStreamOutputDetails {
	finish_reason: FinishReason;
	generated_tokens: number;
	seed?: number;
	[property: string]: unknown;
}

export interface Token {
	id: number;
	logprob: number;
	special: boolean;
	text: string;
	[property: string]: unknown;
}
