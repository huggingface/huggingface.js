import type { SentenceSimilarityInput, SentenceSimilarityOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import { getDefaultTask } from "../../lib/getDefaultTask";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import { omit } from "../../utils/omit";

export type SentenceSimilarityArgs = BaseArgs & SentenceSimilarityInput;

/**
 * Calculate the semantic similarity between one text and a list of other sentences by comparing their embeddings.
 */
export async function sentenceSimilarity(
	args: SentenceSimilarityArgs,
	options?: Options
): Promise<SentenceSimilarityOutput> {
	const defaultTask = args.model ? await getDefaultTask(args.model, args.accessToken, options) : undefined;
	const res = await request<SentenceSimilarityOutput>(prepareInput(args), {
		...options,
		taskHint: "sentence-similarity",
		...(defaultTask === "feature-extraction" && { forceTask: "sentence-similarity" }),
	});

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
