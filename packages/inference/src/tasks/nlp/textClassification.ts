import { validateOutput, z } from "../../lib/validateOutput";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TextClassificationArgs = BaseArgs & {
	/**
	 * A string to be classified
	 */
	inputs: string;
};

export type TextClassificationOutput = {
	/**
	 * The label for the class (model specific)
	 */
	label: string;
	/**
	 * A floats that represents how likely is that the text belongs to this class.
	 */
	score: number;
}[];

/**
 * Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english
 */
export async function textClassification(
	args: TextClassificationArgs,
	options?: Options
): Promise<TextClassificationOutput> {
	const res = await request<TextClassificationOutput[]>(args, {
		...options,
		taskHint: "text-classification",
	});
	return validateOutput(res, z.first(z.array(z.object({ label: z.string(), score: z.number() }))));
}
