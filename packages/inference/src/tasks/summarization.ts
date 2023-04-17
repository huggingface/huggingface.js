import type { Options, SummarizationArgs, SummarizationReturn } from "../types";
import { request } from "./request";

/**
 * This task is well known to summarize longer text into shorter text. Be careful, some models have a maximum length of input. That means that the summary cannot handle full books for instance. Be careful when choosing your model.
 */
export async function summarization(args: SummarizationArgs, options?: Options): Promise<SummarizationReturn> {
	const res = await request<SummarizationReturn[]>(args, options);
	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x.summary_text === "string");
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<summary_text: string>");
	}
	return res?.[0];
}
