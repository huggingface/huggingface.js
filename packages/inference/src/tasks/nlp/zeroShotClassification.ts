import type { ZeroShotClassificationInput, ZeroShotClassificationOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type ZeroShotClassificationArgs = BaseArgs & ZeroShotClassificationInput;

/**
 * This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.
 */
export async function zeroShotClassification(
	args: ZeroShotClassificationArgs,
	options?: Options
): Promise<ZeroShotClassificationOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "zero-shot-classification");
	const { data: res } = await innerRequest<ZeroShotClassificationOutput[number] | ZeroShotClassificationOutput>(
		args,
		providerHelper,
		{
			...options,
			task: "zero-shot-classification",
		}
	);
	return providerHelper.getResponse(res);
}
