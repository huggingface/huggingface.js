import type { ChatCompletionInput, ChatCompletionOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

/**
 * Use the chat completion endpoint to generate a response to a prompt, using OpenAI message completion API no stream
 */
export async function chatCompletion(
	args: BaseArgs & ChatCompletionInput,
	options?: Options
): Promise<ChatCompletionOutput> {
	const provider = args.provider ?? "hf-inference";
	const providerHelper = getProviderHelper(provider, "conversational");
	const response = await request<ChatCompletionOutput>(args, {
		...options,
		task: "conversational",
	});
	return providerHelper.getResponse(response) as ChatCompletionOutput;
}
