import type { SentenceSimilarityInput, SentenceSimilarityOutput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type SentenceSimilarityArgs = BaseArgs & SentenceSimilarityInput;

/**
 * Calculate the semantic similarity between one text and a list of other sentences by comparing their embeddings.
 */
export async function sentenceSimilarity(
	args: SentenceSimilarityArgs,
	options?: Options
): Promise<SentenceSimilarityOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "sentence-similarity");
	const { data: res } = await innerRequest<SentenceSimilarityOutput>(args, providerHelper, {
		...options,
		task: "sentence-similarity",
	});
	return providerHelper.getResponse(res);
}
