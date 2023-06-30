import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type QuestionAnsweringArgs = BaseArgs & {
	inputs: {
		context: string;
		question: string;
	};
};

export interface QuestionAnsweringOutput {
	/**
	 * A string that’s the answer within the text.
	 */
	answer: string;
	/**
	 * The index (string wise) of the stop of the answer within context.
	 */
	end: number;
	/**
	 * A float that represents how likely that the answer is correct
	 */
	score: number;
	/**
	 * The index (string wise) of the start of the answer within context.
	 */
	start: number;
}

/**
 * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
 */
export async function questionAnswering(
	args: QuestionAnsweringArgs,
	options?: Options
): Promise<QuestionAnsweringOutput> {
	const res = await request<QuestionAnsweringOutput>(args, {
		...options,
		taskHint: "question-answering",
	});
	const isValidOutput =
		typeof res === "object" &&
		!!res &&
		typeof res.answer === "string" &&
		typeof res.end === "number" &&
		typeof res.score === "number" &&
		typeof res.start === "number";
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected {answer: string, end: number, score: number, start: number}");
	}
	return res;
}
