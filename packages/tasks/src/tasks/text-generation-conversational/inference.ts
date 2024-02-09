/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for Text Generation inference when using the messages API. Compatible with Open AI
 * chat API.
 */
export interface TextGenerationConversationalInput {
	/**
	 * Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing
	 * frequency in the text so far, decreasing the model's likelihood to repeat the same line
	 * verbatim.
	 */
	frequency_penalty?: number;
	/**
	 * Whether to return log probabilities of the output tokens or not. If true, returns the log
	 * probabilities of each output token returned in the content of message.
	 */
	logprobs?: boolean;
	/**
	 * The maximum number of tokens that can be generated in the chat completion.
	 */
	max_tokens?: number;
	/**
	 * A list of messages comprising the conversation so far.
	 */
	messages: Message[];
	/**
	 * The random sampling seed to use.
	 */
	seed?: number;
	/**
	 * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the
	 * output more random, while lower values like 0.2 will make it more focused and
	 * deterministic. We generally recommend altering this or top_p but not both.
	 */
	temperature?: number;
	/**
	 * An alternative to sampling with temperature, called nucleus sampling, where the model
	 * considers the results of the tokens with top_p probability mass. So 0.1 means only the
	 * tokens comprising the top 10% probability mass are considered.
	 */
	top_p?: number;
	[property: string]: unknown;
}

export interface Message {
	content: string;
	role: string;
	[property: string]: unknown;
}

/**
 * Outputs for Text Generation inference when using the messages API. Compatible with Open
 * AI chat API.
 */
export interface TextGenerationConversationalOutput {
	choices: Choice[];
	/**
	 * The creation date as a UNIX timestamp.
	 */
	created: number;
	id: string;
	/**
	 * The name of the model used for this generation.
	 */
	model: string;
	object: string;
	system_fingerprint: string;
	[property: string]: unknown;
}

export interface Choice {
	delta: Delta;
	/**
	 * The reason why the generation was stopped.
	 */
	finish_reason?: FinishReason;
	index: number;
	logprobs?: number;
	[property: string]: unknown;
}

export interface Delta {
	content?: string;
	role?: string;
	[property: string]: unknown;
}

/**
 * The generated sequence reached the maximum allowed length
 *
 * The model generated an end-of-sentence (EOS) token
 *
 * One of the sequence in stop_sequences was generated
 */
export type FinishReason = "length" | "eos_token" | "stop_sequence";
