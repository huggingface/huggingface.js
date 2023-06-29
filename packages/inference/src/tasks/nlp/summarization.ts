import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type SummarizationArgs = BaseArgs & {
	/**
	 * A string to be summarized
	 */
	inputs: string;
	parameters?: {
		/**
		 * (Default: None). Integer to define the maximum length in tokens of the output summary.
		 */
		max_length?: number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
		 */
		max_time?: number;
		/**
		 * (Default: None). Integer to define the minimum length in tokens of the output summary.
		 */
		min_length?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
		 */
		temperature?: number;
		/**
		 * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
		 */
		top_k?: number;
		/**
		 * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
		 */
		top_p?: number;
	};
};

export interface SummarizationOutput {
	/**
	 * The string after translation
	 */
	summary_text: string;
}

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
