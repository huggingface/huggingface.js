import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

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
 * Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.
 */
export type FeatureExtractionOutput = (number | number[])[];

/**
 * This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.
 */
export async function featureExtraction(
	args: FeatureExtractionArgs,
	options?: Options
): Promise<FeatureExtractionOutput> {
	const res = await request<FeatureExtractionOutput>(args, options);
	let isValidOutput = true;
	// Check if output is an array
	if (Array.isArray(res)) {
		for (const e of res) {
			// Check if output is an array of arrays or numbers
			if (Array.isArray(e)) {
				// if all elements are numbers, continue
				isValidOutput = e.every((x) => typeof x === "number");
				if (!isValidOutput) {
					break;
				}
			} else if (typeof e !== "number") {
				isValidOutput = false;
				break;
			}
		}
	} else {
		isValidOutput = false;
	}
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<number[] | number>");
	}
	return res;
}
