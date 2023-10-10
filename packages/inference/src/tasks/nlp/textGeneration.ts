import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TextGenerationArgs = BaseArgs & {
	/**
	 * A string to be generated from
	 */
	inputs: string;
	parameters?: {
		/**
		 * (Optional: True). Bool. Whether or not to use sampling, use greedy decoding otherwise.
		 */
		do_sample?: boolean;
		/**
		 * (Default: None). Int (0-250). The amount of new tokens to be generated, this does not include the input length it is a estimate of the size of generated text you want. Each new tokens slows down the request, so look for balance between response times and length of text generated.
		 */
		max_new_tokens?: number;
		/**
		 * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. Use that in combination with max_new_tokens for best results.
		 */
		max_time?: number;
		/**
		 * (Default: 1). Integer. The number of proposition you want to be returned.
		 */
		num_return_sequences?: number;
		/**
		 * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
		 */
		repetition_penalty?: number;
		/**
		 * (Default: True). Bool. If set to False, the return results will not contain the original query making it easier for prompting.
		 */
		return_full_text?: boolean;
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
		/**
		 * (Default: None). Integer. The maximum number of tokens from the input.
		 */
		truncate?: number;
		/**
		 * (Default: []) List of strings. The model will stop generating text when one of the strings in the list is generated.
		 * **/
		stop_sequences?: string[];
	};
};

export interface TextGenerationOutput {
	/**
	 * The continuated string
	 */
	generated_text: string;
}

/**
 * Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).
 */
export async function textGeneration(args: TextGenerationArgs, options?: Options): Promise<TextGenerationOutput> {
	const res = await request<TextGenerationOutput[]>(args, {
		...options,
		taskHint: "text-generation",
	});
	const isValidOutput = Array.isArray(res) && res.every((x) => typeof x?.generated_text === "string");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{generated_text: string}>");
	}
	return res?.[0];
}
