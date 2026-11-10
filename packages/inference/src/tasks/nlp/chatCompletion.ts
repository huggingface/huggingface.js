import type { ChatCompletionOutput } from "@huggingface/tasks";
import { InferenceClientInputError } from "../../errors.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import { typedInclude } from "../../utils/typedInclude.js";
import type { ChatCompletionArgs, Options } from "../../types.js";
import { innerRequest } from "../../utils/request.js";
import type { ConversationalTaskHelper, TaskProviderHelper } from "../../providers/providerHelper.js";
import { AutoRouterConversationalTask } from "../../providers/providerHelper.js";

/**
 * Use the chat completion endpoint to generate a response to a prompt, using OpenAI message completion API no stream
 */
export async function chatCompletion(args: ChatCompletionArgs, options?: Options): Promise<ChatCompletionOutput> {
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
	const { data: response } = await innerRequest<ChatCompletionOutput>(rest, providerHelper, {
		...options,
		task: "conversational",
	});
	return providerHelper.getResponse(response);
}
