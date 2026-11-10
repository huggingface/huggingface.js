import type { ChatCompletionStreamOutput } from "@huggingface/tasks";
import { InferenceClientInputError } from "../../errors.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import { typedInclude } from "../../utils/typedInclude.js";
import type { ChatCompletionArgs, Options } from "../../types.js";
import { innerStreamingRequest } from "../../utils/request.js";
import type { ConversationalTaskHelper, TaskProviderHelper } from "../../providers/providerHelper.js";
import { AutoRouterConversationalTask } from "../../providers/providerHelper.js";

/**
 * Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time
 */
export async function* chatCompletionStream(
	args: ChatCompletionArgs,
	options?: Options,
): AsyncGenerator<ChatCompletionStreamOutput> {
	const { provider, ...rest } = args;
	let providerHelper: ConversationalTaskHelper & TaskProviderHelper;
	if (rest.endpointUrl) {
		if (provider) {
			throw new InferenceClientInputError("Specifying both endpointUrl and provider is not supported.");
		}
		providerHelper = getProviderHelper("hf-inference", "conversational");
	} else if (typedInclude(["hf-inference", "openrouter"] as const, provider)) {
		providerHelper = getProviderHelper(provider, "conversational");
	} else {
		// The Hugging Face router picks the provider, `model:provider` pins one. No need to fetch provider mapping.
		providerHelper = new AutoRouterConversationalTask();
		if (provider && provider !== "auto" && rest.model) {
			rest.model = `${rest.model}:${provider}`;
		}
	}
	yield* innerStreamingRequest<ChatCompletionStreamOutput>(rest, providerHelper, {
		...options,
		task: "conversational",
	});
}
