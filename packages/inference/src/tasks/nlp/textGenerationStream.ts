import type { Options } from "../../types";
import { streamingRequest } from "../custom/streamingRequest";
import type { TextGenerationArgs } from "./textGeneration";

export interface TextGenerationStreamToken {
	/** Token ID from the model tokenizer */
	id: number;
	/** Token text */
	text: string;
	/** Logprob */
	logprob: number;
	/**
	 * Is the token a special token
	 * Can be used to ignore tokens when concatenating
	 */
	special: boolean;
}

export interface TextGenerationStreamPrefillToken {
	/** Token ID from the model tokenizer */
	id: number;
	/** Token text */
	text: string;
	/**
	 * Logprob
	 * Optional since the logprob of the first token cannot be computed
	 */
	logprob?: number;
}

export interface TextGenerationStreamBestOfSequence {
	/** Generated text */
	generated_text: string;
	/** Generation finish reason */
	finish_reason: TextGenerationStreamFinishReason;
	/** Number of generated tokens */
	generated_tokens: number;
	/** Sampling seed if sampling was activated */
	seed?: number;
	/** Prompt tokens */
	prefill: TextGenerationStreamPrefillToken[];
	/** Generated tokens */
	tokens: TextGenerationStreamToken[];
}

export enum TextGenerationStreamFinishReason {
	/** number of generated tokens == `max_new_tokens` */
	Length = "length",
	/** the model generated its end of sequence token */
	EndOfSequenceToken = "eos_token",
	/** the model generated a text included in `stop_sequences` */
	StopSequence = "stop_sequence",
}

export interface TextGenerationStreamDetails {
	/** Generation finish reason */
	finish_reason: TextGenerationStreamFinishReason;
	/** Number of generated tokens */
	generated_tokens: number;
	/** Sampling seed if sampling was activated */
	seed?: number;
	/** Prompt tokens */
	prefill: TextGenerationStreamPrefillToken[];
	/** */
	tokens: TextGenerationStreamToken[];
	/** Additional sequences when using the `best_of` parameter */
	best_of_sequences?: TextGenerationStreamBestOfSequence[];
}

export interface TextGenerationStreamReturn {
	/** Generated token, one at a time */
	token: TextGenerationStreamToken;
	/**
	 * Complete generated text
	 * Only available when the generation is finished
	 */
	generated_text: string | null;
	/**
	 * Generation details
	 * Only available when the generation is finished
	 */
	details: TextGenerationStreamDetails | null;
}

/**
 * Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time
 */
export async function* textGenerationStream(
	args: TextGenerationArgs,
	options?: Options
): AsyncGenerator<TextGenerationStreamReturn> {
	yield* streamingRequest<TextGenerationStreamReturn>(args, options);
}
