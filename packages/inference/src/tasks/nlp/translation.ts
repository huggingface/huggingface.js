import { validateOutput, z } from "../../lib/validateOutput";
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
	const output = validateOutput(res, z.array(z.object({ translation_text: z.string() })));
	return output.length === 1 ? output[0] : output;
}
