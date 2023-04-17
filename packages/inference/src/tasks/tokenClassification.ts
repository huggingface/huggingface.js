import type {
	Options,
	TokenClassificationArgs,
	TokenClassificationReturn,
	TokenClassificationReturnValue,
} from "../types";
import { toArray } from "../utils/toArray";
import { request } from "./request";

/**
 * Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english
 */
export async function tokenClassification(
	args: TokenClassificationArgs,
	options?: Options
): Promise<TokenClassificationReturn> {
	const res = toArray(await request<TokenClassificationReturnValue | TokenClassificationReturn>(args, options));
	const isValidOutput =
		Array.isArray(res) &&
		res.every(
			(x) =>
				typeof x.end === "number" &&
				typeof x.entity_group === "string" &&
				typeof x.score === "number" &&
				typeof x.start === "number" &&
				typeof x.word === "string"
		);
	if (!isValidOutput) {
		throw new TypeError(
			"Invalid inference output: output must be of type Array<end: number, entity_group: string, score: number, start: number, word: string>"
		);
	}
	return res;
}
