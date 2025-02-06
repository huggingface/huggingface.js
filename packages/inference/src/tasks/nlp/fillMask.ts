import type { FillMaskInput, FillMaskOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type FillMaskArgs = BaseArgs & FillMaskInput;

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
