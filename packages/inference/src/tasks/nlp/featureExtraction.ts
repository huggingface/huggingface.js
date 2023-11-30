import { getDefaultTask } from "../../lib/getDefaultTask";
import { validateOutput, z } from "../../lib/validateOutput";
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
	const defaultTask = args.model ? await getDefaultTask(args.model, args.accessToken, options) : undefined;

	const res = await request<FeatureExtractionOutput>(args, {
		...options,
		taskHint: "feature-extraction",
		...(defaultTask === "sentence-similarity" && { forceTask: "feature-extraction" }),
	});
	return validateOutput(res, z.array(z.or(z.number(), z.array(z.number()), z.array(z.array(z.number())))));
}
