import type { TextClassificationInput, TextClassificationOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type TextClassificationArgs = BaseArgs & TextClassificationInput;

/**
 * Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english
 */
export async function textClassification(
	args: TextClassificationArgs,
	options?: Options
): Promise<TextClassificationOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "text-classification");
	const { data: res } = await innerRequest<TextClassificationOutput>(args, providerHelper, {
		...options,
		task: "text-classification",
	});
	return providerHelper.getResponse(res);
}
