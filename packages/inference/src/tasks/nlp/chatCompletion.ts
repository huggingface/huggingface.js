import type { ChatCompletionInput, ChatCompletionOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

/**
 * Use the chat completion endpoint to generate a response to a prompt, using OpenAI message completion API no stream
 */
export async function chatCompletion(
	args: BaseArgs & ChatCompletionInput,
	options?: Options
): Promise<ChatCompletionOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "conversational");
	const { data: response } = await innerRequest<ChatCompletionOutput>(args, providerHelper, {
		...options,
		task: "conversational",
	});
	return providerHelper.getResponse(response);
}
