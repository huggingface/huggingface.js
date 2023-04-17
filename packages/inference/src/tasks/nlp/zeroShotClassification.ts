import type { BaseArgs, Options } from "../../types";
import { toArray } from "../../utils/toArray";
import { request } from "../custom/request";

export type ZeroShotClassificationArgs = BaseArgs & {
	/**
	 * a string or list of strings
	 */
	inputs: string | string[];
	parameters: {
		/**
		 * a list of strings that are potential classes for inputs. (max 10 candidate_labels, for more, simply run multiple requests, results are going to be misleading if using too many candidate_labels anyway. If you want to keep the exact same, you can simply run multi_label=True and do the scaling on your end.
		 */
		candidate_labels: string[];
		/**
		 * (Default: false) Boolean that is set to True if classes can overlap
		 */
		multi_label?: boolean;
	};
};

export interface ZeroShotClassificationReturnValue {
	labels: string[];
	scores: number[];
	sequence: string;
}

export type ZeroShotClassificationReturn = ZeroShotClassificationReturnValue[];

/**
 * This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.
 */
export async function zeroShotClassification(
	args: ZeroShotClassificationArgs,
	options?: Options
): Promise<ZeroShotClassificationReturn> {
	const res = toArray(
		await request<ZeroShotClassificationReturn[number] | ZeroShotClassificationReturn>(args, options)
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
		throw new TypeError(
			"Invalid inference output: output must be of type Array<labels: string[], scores: number[], sequence: string>"
		);
	}
	return res;
}
