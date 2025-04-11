import type { TextGenerationInput, TextGenerationOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { HyperbolicTextCompletionOutput } from "../../providers/hyperbolic";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type { TextGenerationInput, TextGenerationOutput };

/**
 * Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).
 */
export async function textGeneration(
	args: BaseArgs & TextGenerationInput,
	options?: Options
): Promise<TextGenerationOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "text-generation");
	const { data: response } = await innerRequest<
		HyperbolicTextCompletionOutput | TextGenerationOutput | TextGenerationOutput[]
	>(args, providerHelper, {
		...options,
		task: "text-generation",
	});
	return providerHelper.getResponse(response);
}
