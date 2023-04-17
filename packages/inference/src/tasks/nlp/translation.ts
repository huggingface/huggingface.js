import type { Options, TranslationArgs, TranslationReturn } from "../../types";
import { request } from "../custom/request";

/**
 * This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.
 */
export async function translation(args: TranslationArgs, options?: Options): Promise<TranslationReturn> {
	const res = await request<TranslationReturn[]>(args, options);
	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.translation_text === "string");
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<translation_text: string>");
	}
	return res?.[0];
}
