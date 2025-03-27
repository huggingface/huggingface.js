import type { TextGenerationInput, TextGenerationOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { HyperbolicTextCompletionOutput } from "../../providers/hyperbolic";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type { TextGenerationInput, TextGenerationOutput };

/**
 * Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).
 */
export async function textGeneration(
	args: BaseArgs & TextGenerationInput,
	options?: Options
): Promise<TextGenerationOutput> {
	if (!args.provider) {
		throw new Error("you need to provide a provider that supports text-generation inference");
	}
	const providerHelper = getProviderHelper(args.provider, "text-generation");
	const response = await request<HyperbolicTextCompletionOutput | TextGenerationOutput | TextGenerationOutput[]>(args, {
		...options,
		task: "text-generation",
	});
	return providerHelper.getResponse(response) as TextGenerationOutput;
}
