import type { ZeroShotClassificationInput, ZeroShotClassificationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { toArray } from "../../utils/toArray";
import { request } from "../custom/request";

export type ZeroShotClassificationArgs = BaseArgs & ZeroShotClassificationInput;

/**
 * This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.
 */
export async function zeroShotClassification(
	args: ZeroShotClassificationArgs,
	options?: Options
): Promise<ZeroShotClassificationOutput> {
	const res = toArray(
		await request<ZeroShotClassificationOutput[number] | ZeroShotClassificationOutput>(args, {
			...options,
			taskHint: "zero-shot-classification",
		})
	);
	const isValidOutput =
		Array.isArray(res) &&
		res.every(
			(x) =>
				Array.isArray(x.labels) &&
				x.labels.every((_label) => typeof _label === "string") &&
				Array.isArray(x.scores) &&
				x.scores.every((_score) => typeof _score === "number") &&
				typeof x.sequence === "string"
		);
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{labels: string[], scores: number[], sequence: string}>");
	}
	return res;
}
