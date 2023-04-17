import type { Options, TableQuestionAnsweringArgs, TableQuestionAnsweringReturn } from "../../types";
import { request } from "../custom/request";

/**
 * Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.
 */
export async function tableQuestionAnswering(
	args: TableQuestionAnsweringArgs,
	options?: Options
): Promise<TableQuestionAnsweringReturn> {
	const res = await request<TableQuestionAnsweringReturn>(args, options);
	const isValidOutput =
		typeof res.aggregator === "string" &&
		typeof res.answer === "string" &&
		Array.isArray(res.cells) &&
		res.cells.every((x) => typeof x === "string") &&
		Array.isArray(res.coordinates) &&
		res.coordinates.every((coord) => Array.isArray(coord) && coord.every((x) => typeof x === "number"));
	if (!isValidOutput) {
		throw new TypeError(
			"Invalid inference output: output must be of type <aggregator: string, answer: string, cells: string[], coordinates: number[][]>"
		);
	}
	return res;
}
