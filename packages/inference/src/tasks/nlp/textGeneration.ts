import type { TextGenerationInput, TextGenerationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { toArray } from "../../utils/toArray";
import { request } from "../custom/request";

export type { TextGenerationInput, TextGenerationOutput };

/**
 * Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).
 */
export async function textGeneration(
	args: BaseArgs & TextGenerationInput,
	options?: Options
): Promise<TextGenerationOutput> {
	const res = toArray(
		await request<TextGenerationOutput | TextGenerationOutput[]>(args, {
			...options,
			taskHint: "text-generation",
		})
	);
	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x?.generated_text === "string");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{generated_text: string}>");
	}
	return res?.[0];
}
