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
	if (!args.provider) {
		throw new Error("you need to provide a provider that supports chatCompletion inference");
	}
	const providerHelper = getProviderHelper(args.provider, "conversational");
	const res = await request<ChatCompletionOutput>(args, {
		...options,
		task: "conversational",
		chatCompletion: true,
	});
	return providerHelper.getResponse(res) as ChatCompletionOutput;
}
