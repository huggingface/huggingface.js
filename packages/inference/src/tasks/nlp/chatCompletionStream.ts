import type { ChatCompletionInput, ChatCompletionStreamOutput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerStreamingRequest } from "../../utils/request";

/**
 * Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time
 */
export async function* chatCompletionStream(
	args: BaseArgs & ChatCompletionInput,
	options?: Options
): AsyncGenerator<ChatCompletionStreamOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "conversational");
	yield* innerStreamingRequest<ChatCompletionStreamOutput>(args, providerHelper, {
		...options,
		task: "conversational",
	});
}
