import type { Options, TextClassificationArgs, TextClassificationReturn } from "../../types";
import { request } from "../custom/request";

/**
 * Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english
 */
export async function textClassification(
	args: TextClassificationArgs,
	options?: Options
): Promise<TextClassificationReturn> {
	const res = (await request<TextClassificationReturn[]>(args, options))?.[0];
	const isValidOutput =
		Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<label: string, score: number>");
	}
	return res;
}
