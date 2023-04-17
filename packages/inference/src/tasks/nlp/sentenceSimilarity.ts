import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type SentenceSimilarityArgs = BaseArgs & {
	/**
	 * The inputs vary based on the model. For example when using sentence-transformers/paraphrase-xlm-r-multilingual-v1 the inputs will look like this:
	 *
	 *  inputs: &#123;
	 *    "source_sentence": "That is a happy person",
	 *    "sentences": ["That is a happy dog", "That is a very happy person", "Today is a sunny day"]
	 *  &#125;
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
	const res = await request<SentenceSimilarityOutput>(args, options);

	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x === "number");
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<number>");
	}
	return res;
}
