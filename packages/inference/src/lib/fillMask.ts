import type { FillMaskArgs, FillMaskReturn, Options } from "../types";
import { request } from "./request";

/**
 * Tries to fill in a hole with a missing word (token to be precise). That’s the base task for BERT models.
 */
export async function fillMask(args: FillMaskArgs, options?: Options): Promise<FillMaskReturn> {
	const res = await request<FillMaskReturn>(args, options);
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
		throw new TypeError(
			"Invalid inference output: output must be of type Array<score: number, sequence:string, token:number, token_str:string>"
		);
	}
	return res;
}
