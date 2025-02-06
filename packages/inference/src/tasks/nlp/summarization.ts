import type { SummarizationInput, SummarizationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type SummarizationArgs = BaseArgs & SummarizationInput;

/**
 * This task is well known to summarize longer text into shorter text. Be careful, some models have a maximum length of input. That means that the summary cannot handle full books for instance. Be careful when choosing your model.
 */
export async function summarization(args: SummarizationArgs, options?: Options): Promise<SummarizationOutput> {
	const res = await request<SummarizationOutput[]>(args, {
		...options,
		taskHint: "summarization",
	});
	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x?.summary_text === "string");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{summary_text: string}>");
	}
	return res?.[0];
}
