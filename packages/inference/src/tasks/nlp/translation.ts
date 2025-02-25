import type { TranslationInput, TranslationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TranslationArgs = BaseArgs & TranslationInput;
/**
 * This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.
 */
export async function translation(args: TranslationArgs, options?: Options): Promise<TranslationOutput> {
	const res = await request<TranslationOutput>(args, {
		...options,
		task: "translation",
	});
	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x?.translation_text === "string");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected type Array<{translation_text: string}>");
	}
	return res?.length === 1 ? res?.[0] : res;
}
