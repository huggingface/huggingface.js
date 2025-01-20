import type { TableQuestionAnsweringInput, TableQuestionAnsweringOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TableQuestionAnsweringArgs = BaseArgs & TableQuestionAnsweringInput;


/**
 * Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.
 */
export async function tableQuestionAnswering(
	args: TableQuestionAnsweringArgs,
	options?: Options
): Promise<TableQuestionAnsweringOutput> {
	const res = await request<TableQuestionAnsweringOutput>(args, {
		...options,
		taskHint: "table-question-answering",
	});
	const isValidOutput =
		Array.isArray(res) && res.every(elem => {
			typeof elem?.aggregator === "string" &&
				typeof elem.answer === "string" &&
				Array.isArray(elem.cells) &&
				elem.cells.every((x) => typeof x === "string") &&
				Array.isArray(elem.coordinates) &&
				elem.coordinates.every((coord) => Array.isArray(coord) && coord.every((x) => typeof x === "number"))
		});
	if (!isValidOutput) {
		throw new InferenceOutputError(
			"Expected {aggregator: string, answer: string, cells: string[], coordinates: number[][]}"
		);
	}
	return res;
}
