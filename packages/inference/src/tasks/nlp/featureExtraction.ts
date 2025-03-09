import type { FeatureExtractionInput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type FeatureExtractionArgs = BaseArgs & FeatureExtractionInput;

/**
 * Returned values are a multidimensional array of floats (dimension depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README).
 */
export type FeatureExtractionOutput = (number | number[] | number[][])[];

/**
 * This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.
 */
export async function featureExtraction(
	args: FeatureExtractionArgs,
	options?: Options
): Promise<FeatureExtractionOutput> {
	const res = await request<FeatureExtractionOutput>(args, {
		...options,
		task: "feature-extraction",
	});
	let isValidOutput = true;

	const isNumArrayRec = (arr: unknown[], maxDepth: number, curDepth = 0): boolean => {
		if (curDepth > maxDepth) return false;
		if (arr.every((x) => Array.isArray(x))) {
			return arr.every((x) => isNumArrayRec(x as unknown[], maxDepth, curDepth + 1));
		} else {
			return arr.every((x) => typeof x === "number");
		}
	};

	isValidOutput = Array.isArray(res) && isNumArrayRec(res, 3, 0);

	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<number[][][] | number[][] | number[] | number>");
	}
	return res;
}
