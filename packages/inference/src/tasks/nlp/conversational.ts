import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type ConversationalArgs = BaseArgs & {
	inputs: {
		/**
		 * A list of strings corresponding to the earlier replies from the model.
		 */
		generated_responses?: string[];
		/**
		 * A list of strings corresponding to the earlier replies from the user. Should be of the same length of generated_responses.
		 */
		past_user_inputs?: string[];
		/**
		 * The last input from the user in the conversation.
		 */
		text: string;
	};
	parameters?: {
		/**
		 * (Default: None). Integer to define the maximum length in tokens of the output summary.
		 */
		max_length?: number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
		 */
		max_time?: number;
		/**
		 * (Default: None). Integer to define the minimum length in tokens of the output summary.
		 */
		min_length?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?: number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?: number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?: number;
	};
};

export interface ConversationalOutput {
	conversation: {
		generated_responses: string[];
		past_user_inputs: string[];
	};
	generated_text: string;
	warnings: string[];
}

/**
 * This task corresponds to any chatbot like structure. Models tend to have shorter max_length, so please check with caution when using a given model if you need long range dependency or not. Recommended model: microsoft/DialoGPT-large.
 *
 */
export async function conversational(args: ConversationalArgs, options?: Options): Promise<ConversationalOutput> {
	const res = await request<ConversationalOutput>(args, { ...options, taskHint: "conversational" });
	const isValidOutput =
		Array.isArray(res.conversation.generated_responses) &&
		res.conversation.generated_responses.every((x) => typeof x === "string") &&
		Array.isArray(res.conversation.past_user_inputs) &&
		res.conversation.past_user_inputs.every((x) => typeof x === "string") &&
		typeof res.generated_text === "string" &&
		(typeof res.warnings === "undefined" ||
			(Array.isArray(res.warnings) && res.warnings.every((x) => typeof x === "string")));
	if (!isValidOutput) {
		throw new InferenceOutputError(
			"Expected {conversation: {generated_responses: string[], past_user_inputs: string[]}, generated_text: string, warnings: string[]}"
		);
	}
	return res;
}
