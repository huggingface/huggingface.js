import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

const HF_INFERENCE_API_PIPELINE_FEATURE_EXTRACTION = "feature-extraction";

export type FeatureExtractionArgs = BaseArgs & {
	/**
	 *  The inputs is a string or a list of strings to get the features from.
	 *
	 *  inputs: "That is a happy person",
	 *
	 */
	inputs: string | string[];
};

/**
 * Returned values are a list of floats, or a list of list of floats, or a list of list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.
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
		pipeline: HF_INFERENCE_API_PIPELINE_FEATURE_EXTRACTION,
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

	isValidOutput = Array.isArray(res) && isNumArrayRec(res, 2, 0);

	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<number[][] | number[] | number>");
	}
	return res;
}
