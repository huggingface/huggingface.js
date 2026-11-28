import type { ChatCompletionInput, ChatCompletionOutput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import type { BaseArgs, Options } from "../../types.js";
import { innerRequest } from "../../utils/request.js";
import type { ConversationalTaskHelper, TaskProviderHelper } from "../../providers/providerHelper.js";
import { AutoRouterConversationalTask } from "../../providers/providerHelper.js";

/**
 * Use the chat completion endpoint to generate a response to a prompt, using OpenAI message completion API no stream
 */
export async function chatCompletion(
	args: Omit<BaseArgs, "provider"> & { provider?: string } & ChatCompletionInput,
	options?: Options,
): Promise<ChatCompletionOutput> {
	let providerHelper: ConversationalTaskHelper & TaskProviderHelper;
	if (args.endpointUrl) {
		const provider = await resolveProvider(args.provider, args.model, args.endpointUrl, options);
		providerHelper = getProviderHelper(provider, "conversational");
	} else if (!args.provider || args.provider === "auto") {
		// Special case: we have a dedicated auto-router for conversational models. No need to fetch provider mapping.
		providerHelper = new AutoRouterConversationalTask();
	} else if (args.model && args.provider !== "hf-inference" && args.provider !== "openai") {
		// The router resolves `model:provider` server-side, no Hub mapping lookup.
		// `hf-inference` and `openai` keep their dedicated routes.
		providerHelper = new AutoRouterConversationalTask();
		args = { ...args, model: `${args.model}:${args.provider}` };
	} else {
		const provider = await resolveProvider(args.provider, args.model, args.endpointUrl, options);
		providerHelper = getProviderHelper(provider, "conversational");
	}
	const { data: response } = await innerRequest<ChatCompletionOutput>(args, providerHelper, {
		...options,
		task: "conversational",
	});
	return providerHelper.getResponse(response);
}
