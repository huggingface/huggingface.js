import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type FillMaskArgs = BaseArgs & {
	inputs: string;
};

export type FillMaskOutput = {
	/**
	 * The probability for this token.
	 */
	score: number;
	/**
	 * The actual sequence of tokens that ran against the model (may contain special tokens)
	 */
	sequence: string;
	/**
	 * The id of the token
	 */
	token: number;
	/**
	 * The string representation of the token
	 */
	token_str: string;
}[];

/**
 * Tries to fill in a hole with a missing word (token to be precise). That’s the base task for BERT models.
 */
export async function fillMask(args: FillMaskArgs, options?: Options): Promise<FillMaskOutput> {
	const res = await request<FillMaskOutput>(args, {
		...options,
		taskHint: "fill-mask",
	});
	const isValidOutput =
		Array.isArray(res) &&
		res.every(
			(x) =>
				typeof x.score === "number" &&
				typeof x.sequence === "string" &&
				typeof x.token === "number" &&
				typeof x.token_str === "string"
		);
	if (!isValidOutput) {
		throw new InferenceOutputError(
			"Expected Array<{score: number, sequence: string, token: number, token_str: string}>"
		);
	}
	return res;
}
