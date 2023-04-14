import type { Options, SentenceSimilarityArgs, SentenceSimilarityReturn } from "../types";
import { request } from "./request";

/**
 * Calculate the semantic similarity between one text and a list of other sentences by comparing their embeddings.
 */
export async function sentenceSimilarity(
	args: SentenceSimilarityArgs,
	options?: Options
): Promise<SentenceSimilarityReturn> {
	const res = await request<SentenceSimilarityReturn>(args, options);

	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x === "number");
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<number>");
	}
	return res;
}
