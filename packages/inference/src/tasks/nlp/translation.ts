import type { TranslationInput, TranslationOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type TranslationArgs = BaseArgs & TranslationInput;
/**
 * This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.
 */
export async function translation(args: TranslationArgs, options?: Options): Promise<TranslationOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "translation");
	const { data: res } = await innerRequest<TranslationOutput>(args, providerHelper, {
		...options,
		task: "translation",
	});
	return providerHelper.getResponse(res);
}
