import type { TokenClassificationInput, TokenClassificationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";
import { toArray } from "../../utils/toArray";

export type TokenClassificationArgs = BaseArgs & TokenClassificationInput;

/**
 * Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english
 */
export async function tokenClassification(
	args: TokenClassificationArgs,
	options?: Options
): Promise<TokenClassificationOutput> {
	const { data: res } = await innerRequest<TokenClassificationOutput[number] | TokenClassificationOutput>(args, {
		...options,
		task: "token-classification",
	});
	const output = toArray(res);
	const isValidOutput =
		Array.isArray(output) &&
		output.every(
			(x) =>
				typeof x.end === "number" &&
				typeof x.entity_group === "string" &&
				typeof x.score === "number" &&
				typeof x.start === "number" &&
				typeof x.word === "string"
		);
	if (!isValidOutput) {
		throw new InferenceOutputError(
			"Expected Array<{end: number, entity_group: string, score: number, start: number, word: string}>"
		);
	}
	return output;
}
