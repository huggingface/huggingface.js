import type { Options, QuestionAnsweringArgs, QuestionAnsweringReturn } from "../types";
import { request } from "./request";

/**
 * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
 */
export async function questionAnswering(
	args: QuestionAnsweringArgs,
	options?: Options
): Promise<QuestionAnsweringReturn> {
	const res = await request<QuestionAnsweringReturn>(args, options);
	const isValidOutput =
		typeof res.answer === "string" &&
		typeof res.end === "number" &&
		typeof res.score === "number" &&
		typeof res.start === "number";
	if (!isValidOutput) {
		throw new TypeError(
			"Invalid inference output: output must be of type <answer: string, end: number, score: number, start: number>"
		);
	}
	return res;
}
