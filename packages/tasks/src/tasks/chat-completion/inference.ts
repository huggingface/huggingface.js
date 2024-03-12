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
	 * The maximum number of tokens that can be generated in the chat completion. The total
	 * length of input tokens and generated tokens is limited by the model's context length.
	 */
	max_tokens?: number;
	messages?: MessageElement[];
	/**
	 * ID of the model to use. See the model endpoint compatibility table for details on which
	 * models work with the Chat API.
	 */
	model?: string;
	/**
	 * The random sampling seed.
	 */
	seed?: number;
	/**
	 * Up to 4 sequences where the API will stop generating further tokens.
	 */
	stop?: string;
	/**
	 * If set, partial message deltas will be sent, like in ChatGPT. Tokens will be sent as
	 * data-only server-sent events as they become available, with the stream terminated by a
	 * data: [DONE] message.
	 */
	stream?: boolean;
	/**
	 * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the
	 * output more random, while lower values like 0.2 will make it more focused and
	 * deterministic. We generally recommend altering this or top_p but not both.
	 */
	temperature?: number;
	/**
	 * An alternative to sampling with temperature, called nucleus sampling, where the model
	 * considers the results of the tokens with top_p probability mass. So 0.1 means only the
	 * tokens comprising the top 10% probability mass are considered. We generally recommend
	 * altering this or temperature but not both.
	 */
	top_p?: number;
	[property: string]: unknown;
}

export interface MessageElement {
	/**
	 * The contents of the system message.
	 *
	 * The contents of the user message.
	 *
	 * The contents of the assistant message.
	 */
	content: string;
	/**
	 * The role of the messages author, in this case system.
	 *
	 * The role of the messages author, in this case user.
	 *
	 * The role of the messages author, in this case assistant.
	 */
	role: Role;
	[property: string]: unknown;
}

export type Role = "system" | "user" | "assistant";

/**
 * Outputs for Chat Completion inference
 */
export interface ChatCompletionOutput {
	/**
	 * A list of chat completion choices.
	 */
	choices: Choice[];
	/**
	 * The Unix timestamp (in seconds) of when the chat completion was created.
	 */
	created: number;
	/**
	 * A unique identifier for the chat completion.
	 */
	id: string;
	/**
	 * The model used for the chat completion.
	 */
	model: string;
	/**
	 * This fingerprint represents the backend configuration that the model runs with.
	 */
	system_fingerprint: string;
	[property: string]: unknown;
}

export interface Choice {
	/**
	 * The reason why the model stopped generating tokens.
	 */
	finish_reason: string;
	/**
	 * The index of the choice in the list of choices.
	 */
	index: number;
	message: ChoiceMessage;
	[property: string]: unknown;
}

export interface ChoiceMessage {
	/**
	 * The content of the chat completion message.
	 */
	content: string;
	[property: string]: unknown;
}
