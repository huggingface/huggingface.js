import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TranslationArgs = BaseArgs & {
	/**
	 * A string to be translated
	 */
	inputs: string | string[];
};

export interface TranslationOutputValue {
	/**
	 * The string after translation
	 */
	translation_text: string;
}

export type TranslationOutput = TranslationOutputValue | TranslationOutputValue[];

/**
 * This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.
 */
export async function translation(args: TranslationArgs, options?: Options): Promise<TranslationOutput> {
	const res = await request<TranslationOutputValue[]>(args, {
		...options,
		taskHint: "translation",
	});
	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x?.translation_text === "string");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected type Array<{translation_text: string}>");
	}
	return res?.length === 1 ? res?.[0] : res;
}
