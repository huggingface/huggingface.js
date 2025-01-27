import type { QuestionAnsweringInput, QuestionAnsweringOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type QuestionAnsweringArgs = BaseArgs & QuestionAnsweringInput;

/**
 * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
 */
export async function questionAnswering(
	args: QuestionAnsweringArgs,
	options?: Options
): Promise<QuestionAnsweringOutput[number]> {
	const res = await request<QuestionAnsweringOutput | QuestionAnsweringOutput[number]>(args, {
		...options,
		taskHint: "question-answering",
	});
	const isValidOutput = Array.isArray(res)
		? res.every(
				(elem) =>
					typeof elem === "object" &&
					!!elem &&
					typeof elem.answer === "string" &&
					typeof elem.end === "number" &&
					typeof elem.score === "number" &&
					typeof elem.start === "number"
		  )
		: typeof res === "object" &&
		  !!res &&
		  typeof res.answer === "string" &&
		  typeof res.end === "number" &&
		  typeof res.score === "number" &&
		  typeof res.start === "number";
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{answer: string, end: number, score: number, start: number}>");
	}
	return Array.isArray(res) ? res[0] : res;
}
