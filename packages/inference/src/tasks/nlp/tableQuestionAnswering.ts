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
): Promise<TableQuestionAnsweringOutput[number]> {
	const res = await request<TableQuestionAnsweringOutput | TableQuestionAnsweringOutput[number]>(args, {
		...options,
		task: "table-question-answering",
	});
	const isValidOutput = Array.isArray(res) ? res.every((elem) => validate(elem)) : validate(res);
	if (!isValidOutput) {
		throw new InferenceOutputError(
			"Expected {aggregator: string, answer: string, cells: string[], coordinates: number[][]}"
		);
	}
	return Array.isArray(res) ? res[0] : res;
}

function validate(elem: unknown): elem is TableQuestionAnsweringOutput[number] {
	return (
		typeof elem === "object" &&
		!!elem &&
		"aggregator" in elem &&
		typeof elem.aggregator === "string" &&
		"answer" in elem &&
		typeof elem.answer === "string" &&
		"cells" in elem &&
		Array.isArray(elem.cells) &&
		elem.cells.every((x: unknown): x is string => typeof x === "string") &&
		"coordinates" in elem &&
		Array.isArray(elem.coordinates) &&
		elem.coordinates.every(
			(coord: unknown): coord is number[] => Array.isArray(coord) && coord.every((x) => typeof x === "number")
		)
	);
}
