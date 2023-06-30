import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { toArray } from "../../utils/toArray";
import { request } from "../custom/request";

export type TokenClassificationArgs = BaseArgs & {
	/**
	 * A string to be classified
	 */
	inputs: string;
	parameters?: {
		/**
		 * (Default: simple). There are several aggregation strategies:
		 *
		 * none: Every token gets classified without further aggregation.
		 *
		 * simple: Entities are grouped according to the default schema (B-, I- tags get merged when the tag is similar).
		 *
		 * first: Same as the simple strategy except words cannot end up with different tags. Words will use the tag of the first token when there is ambiguity.
		 *
		 * average: Same as the simple strategy except words cannot end up with different tags. Scores are averaged across tokens and then the maximum label is applied.
		 *
		 * max: Same as the simple strategy except words cannot end up with different tags. Word entity will be the token with the maximum score.
		 */
		aggregation_strategy?: "none" | "simple" | "first" | "average" | "max";
	};
};

export interface TokenClassificationOutputValue {
	/**
	 * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
	 */
	end: number;
	/**
	 * The type for the entity being recognized (model specific).
	 */
	entity_group: string;
	/**
	 * How likely the entity was recognized.
	 */
	score: number;
	/**
	 * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
	 */
	start: number;
	/**
	 * The string that was captured
	 */
	word: string;
}

export type TokenClassificationOutput = TokenClassificationOutputValue[];

/**
 * Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english
 */
export async function tokenClassification(
	args: TokenClassificationArgs,
	options?: Options
): Promise<TokenClassificationOutput> {
	const res = toArray(
		await request<TokenClassificationOutput[number] | TokenClassificationOutput>(args, {
			...options,
			taskHint: "token-classification",
		})
	);
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
		throw new InferenceOutputError(
			"Expected Array<{end: number, entity_group: string, score: number, start: number, word: string}>"
		);
	}
	return res;
}
