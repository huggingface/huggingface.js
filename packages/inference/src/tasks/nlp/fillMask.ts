import { validateOutput, z } from "../../lib/validateOutput";
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
	return validateOutput(
		res,
		z.array(z.object({ score: z.number(), sequence: z.string(), token: z.number(), token_str: z.string() }))
	);
}
