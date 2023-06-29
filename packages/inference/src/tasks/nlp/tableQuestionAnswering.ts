import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TableQuestionAnsweringArgs = BaseArgs & {
	inputs: {
		/**
		 * The query in plain text that you want to ask the table
		 */
		query: string;
		/**
		 * A table of data represented as a dict of list where entries are headers and the lists are all the values, all lists must have the same size.
		 */
		table: Record<string, string[]>;
	};
};

export interface TableQuestionAnsweringOutput {
	/**
	 * The aggregator used to get the answer
	 */
	aggregator: string;
	/**
	 * The plaintext answer
	 */
	answer: string;
	/**
	 * A list of coordinates of the cells contents
	 */
	cells: string[];
	/**
	 * a list of coordinates of the cells referenced in the answer
	 */
	coordinates: number[][];
}

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
		typeof res?.aggregator === "string" &&
		typeof res.answer === "string" &&
		Array.isArray(res.cells) &&
		res.cells.every((x) => typeof x === "string") &&
		Array.isArray(res.coordinates) &&
		res.coordinates.every((coord) => Array.isArray(coord) && coord.every((x) => typeof x === "number"));
	if (!isValidOutput) {
		throw new InferenceOutputError(
			"Expected {aggregator: string, answer: string, cells: string[], coordinates: number[][]}"
		);
	}
	return res;
}
