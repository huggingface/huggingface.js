import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type VisualQuestionAnsweringArgs = BaseArgs & {
	inputs: {
		/** Base64 of image **/
		image: string;
		question: string;
	};
};

export interface VisualQuestionAnsweringOutput {
	/**
	 * A string that’s the answer to a visual question.
	 */
	answer: string;
	/**
	 * Answer correctness score.
	 */
	score: number;
}

/**
 * Answers a question on an image. Recommended model: dandelin/vilt-b32-finetuned-vqa.
 */
export async function visualQuestionAnswering(args: VisualQuestionAnsweringArgs, options?: Options): Promise<VisualQuestionAnsweringOutput> {
	const res = (await request<[VisualQuestionAnsweringOutput]>(args, options))?.[0];
	const isValidOutput =
		typeof res?.answer === "string" &&
		typeof res.score === "number";
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected {answer: string, score: number}");
	}
	return res;
}


