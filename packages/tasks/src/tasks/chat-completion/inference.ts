/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */

/**
 * Inputs for ChatCompletion inference
 */
export interface ChatCompletionInput {
	/**
	 * Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing
	 * frequency in the text so far, decreasing the model's likelihood to repeat the same line
	 * verbatim.
	 */
	frequency_penalty?: number;
	/**
	 * The maximum number of tokens that can be generated in the chat completion.
	 */
	max_tokens?: number;
	messages: ChatCompletionInputMessage[];
	/**
	 * The random sampling seed.
	 */
	seed?: number;
	/**
	 * Stop generating tokens if a stop token is generated.
	 */
	stop?: Stop;
	/**
	 * If set, partial message deltas will be sent.
	 */
	stream?: boolean;
	/**
	 * The value used to modulate the logits distribution.
	 */
	temperature?: number;
	/**
	 * If set to < 1, only the smallest set of most probable tokens with probabilities that add
	 * up to `top_p` or higher are kept for generation.
	 */
	top_p?: number;
	[property: string]: unknown;
}

export interface ChatCompletionInputMessage {
	/**
	 * The content of the message.
	 */
	content: string;
	/**
	 * The role of the messages author.
	 */
	role: Role;
	[property: string]: unknown;
}

/**
 * The role of the messages author.
 */
export type Role = "assistant" | "system" | "user";

/**
 * Stop generating tokens if a stop token is generated.
 */
export type Stop = string[] | string;

/**
 * Outputs for Chat Completion inference
 */
export interface ChatCompletionOutput {
	/**
	 * A list of chat completion choices.
	 */
	choices: ChatCompletionOutputChoice[];
	/**
	 * The Unix timestamp (in seconds) of when the chat completion was created.
	 */
	created: number;
	[property: string]: unknown;
}

export interface ChatCompletionOutputChoice {
	/**
	 * The reason why the model stopped generating tokens.
	 */
	finish_reason: string;
	/**
	 * The index of the choice in the list of choices.
	 */
	index: number;
	message: ChatCompletionOutputChoiceMessage;
	[property: string]: unknown;
}

export interface ChatCompletionOutputChoiceMessage {
	/**
	 * The content of the chat completion message.
	 */
	content: string;
	[property: string]: unknown;
}
