import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

const HF_INFERENCE_API_PIPELINE_SENTENCE_SIMILARITY = "sentence-similarity";

export type SentenceSimilarityArgs = BaseArgs & {
	/**
	 * The inputs vary based on the model.
	 *
	 * For example when using sentence-transformers/paraphrase-xlm-r-multilingual-v1 the inputs will have a `source_sentence` string and
	 * a `sentences` array of strings
	 */
	inputs: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Returned values are a list of floats
 */
export type SentenceSimilarityOutput = number[];

/**
 * Calculate the semantic similarity between one text and a list of other sentences by comparing their embeddings.
 */
export async function sentenceSimilarity(
	args: SentenceSimilarityArgs,
	options?: Options
): Promise<SentenceSimilarityOutput> {
	const res = await request<SentenceSimilarityOutput>(args, {
		...options,
		pipeline: HF_INFERENCE_API_PIPELINE_SENTENCE_SIMILARITY,
	});

	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x === "number");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected number[]");
	}
	return res;
}
