import type { ConversationalArgs, ConversationalReturn, Options } from "../../types";
import { request } from "../custom/request";

/**
 * This task corresponds to any chatbot like structure. Models tend to have shorter max_length, so please check with caution when using a given model if you need long range dependency or not. Recommended model: microsoft/DialoGPT-large.
 *
 */
export async function conversational(args: ConversationalArgs, options?: Options): Promise<ConversationalReturn> {
	const res = await request<ConversationalReturn>(args, options);
	const isValidOutput =
		Array.isArray(res.conversation.generated_responses) &&
		res.conversation.generated_responses.every((x) => typeof x === "string") &&
		Array.isArray(res.conversation.past_user_inputs) &&
		res.conversation.past_user_inputs.every((x) => typeof x === "string") &&
		typeof res.generated_text === "string" &&
		Array.isArray(res.warnings) &&
		res.warnings.every((x) => typeof x === "string");
	if (!isValidOutput) {
		throw new TypeError(
			"Invalid inference output: output must be of type <conversation: {generated_responses: string[], past_user_inputs: string[]}, generated_text: string, warnings: string[]>"
		);
	}
	return res;
}
