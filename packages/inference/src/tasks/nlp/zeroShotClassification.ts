import type {
	Options,
	ZeroShotClassificationArgs,
	ZeroShotClassificationReturn,
	ZeroShotClassificationReturnValue,
} from "../../types";
import { toArray } from "../../utils/toArray";
import { request } from "../custom/request";

/**
 * This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.
 */
export async function zeroShotClassification(
	args: ZeroShotClassificationArgs,
	options?: Options
): Promise<ZeroShotClassificationReturn> {
	const res = toArray(await request<ZeroShotClassificationReturnValue | ZeroShotClassificationReturn>(args, options));
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
		throw new TypeError(
			"Invalid inference output: output must be of type Array<labels: string[], scores: number[], sequence: string>"
		);
	}
	return res;
}
