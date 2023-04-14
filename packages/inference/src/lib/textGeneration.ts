import type { Options, TextGenerationArgs, TextGenerationReturn } from "../types";
import { request } from "./request";

/**
 * Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).
 */
export async function textGeneration(args: TextGenerationArgs, options?: Options): Promise<TextGenerationReturn> {
	const res = await request<TextGenerationReturn[]>(args, options);
	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.generated_text === "string");
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<generated_text: string>");
	}
	return res?.[0];
}
