import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import type { ChatCompletionInput, ChatCompletionOutput } from "@huggingface/tasks";

/**
 * Use the chat completion endpoint to generate a response to a prompt, using OpenAI message completion API no stream
 */
export async function chatCompletion(
	args: BaseArgs & ChatCompletionInput,
	options?: Options
): Promise<ChatCompletionOutput> {
	const res = await request<ChatCompletionOutput>(args, {
		...options,
		taskHint: "text-generation",
		chatCompletion: true,
	});
	const isValidOutput =
		typeof res === "object" &&
		Array.isArray(res?.choices) &&
		typeof res?.created === "number" &&
		typeof res?.id === "string" &&
		typeof res?.model === "string" &&
		/// Together.ai does not output a system_fingerprint
		(res.system_fingerprint === undefined || typeof res.system_fingerprint === "string") &&
		typeof res?.usage === "object";

	if (!isValidOutput) {
		throw new InferenceOutputError("Expected ChatCompletionOutput");
	}
	return res;
}
