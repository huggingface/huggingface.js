import type { FeatureExtractionInput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

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
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "feature-extraction");
	const { data: res } = await innerRequest<FeatureExtractionOutput>(args, providerHelper, {
		...options,
		task: "feature-extraction",
	});
	return providerHelper.getResponse(res);
}
