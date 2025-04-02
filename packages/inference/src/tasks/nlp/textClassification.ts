import type { TextClassificationInput, TextClassificationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
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
	const { data: res } = await innerRequest<TextClassificationOutput>(args, {
		...options,
		task: "text-classification",
	});
	const output = res?.[0];
	const isValidOutput =
		Array.isArray(output) && output.every((x) => typeof x?.label === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{label: string, score: number}>");
	}
	return output;
}
