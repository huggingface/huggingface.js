import type { SentenceSimilarityInput, SentenceSimilarityOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { omit } from "../../utils/omit";
import { innerRequest } from "../../utils/request";

export type SentenceSimilarityArgs = BaseArgs & SentenceSimilarityInput;

/**
 * Calculate the semantic similarity between one text and a list of other sentences by comparing their embeddings.
 */
export async function sentenceSimilarity(
	args: SentenceSimilarityArgs,
	options?: Options
): Promise<SentenceSimilarityOutput> {
	const res = (
		await innerRequest<SentenceSimilarityOutput>(prepareInput(args), {
			...options,
			task: "sentence-similarity",
		})
	).data;

	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x === "number");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected number[]");
	}
	return res;
}

function prepareInput(args: SentenceSimilarityArgs) {
	return {
		...omit(args, ["inputs", "parameters"]),
		inputs: { ...omit(args.inputs, "sourceSentence") },
		parameters: { source_sentence: args.inputs.sourceSentence, ...args.parameters },
	};
}
