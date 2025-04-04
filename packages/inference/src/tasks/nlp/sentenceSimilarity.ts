import type { SentenceSimilarityInput, SentenceSimilarityOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type SentenceSimilarityArgs = BaseArgs & SentenceSimilarityInput;

/**
 * Calculate the semantic similarity between one text and a list of other sentences by comparing their embeddings.
 */
export async function sentenceSimilarity(
	args: SentenceSimilarityArgs,
	options?: Options
): Promise<SentenceSimilarityOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "sentence-similarity");
	const res = await request<SentenceSimilarityOutput>(args, {
		...options,
		task: "sentence-similarity",
	});
	return providerHelper.getResponse(res);
}
