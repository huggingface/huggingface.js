import type { TokenClassificationInput, TokenClassificationOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { toArray } from "../../utils/toArray";
import { request } from "../custom/request";

export type TokenClassificationArgs = BaseArgs & TokenClassificationInput;

/**
 * Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english
 */
export async function tokenClassification(
	args: TokenClassificationArgs,
	options?: Options
): Promise<TokenClassificationOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "token-classification");
	const res = toArray(
		await request<TokenClassificationOutput[number] | TokenClassificationOutput>(args, {
			...options,
			task: "token-classification",
		})
	);
	return providerHelper.getResponse(res);
}
