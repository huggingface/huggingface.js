import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type DocumentQuestionAnsweringArgs = BaseArgs & {
	inputs: {
		/** Base64 of document image **/
		image: string;
		question: string;
	};
};

export interface DocumentQuestionAnsweringOutput {
	/**
	 * A string that’s the answer within the document.
	 */
	answer: string;
	/**
	 * ?
	 */
	end: number;
	/**
	 * A float that represents how likely that the answer is correct
	 */
	score: number;
	/**
	 * ?
	 */
	start: number;
}

/**
 * Answers a question on a document image. Recommended model: impira/layoutlm-document-qa.
 */
export async function documentQuestionAnswering(
	args: DocumentQuestionAnsweringArgs,
	options?: Options
): Promise<DocumentQuestionAnsweringOutput> {
	const res = (await request<[DocumentQuestionAnsweringOutput]>(args, options))?.[0];
	const isValidOutput =
		typeof res?.answer === "string" &&
		typeof res.end === "number" &&
		typeof res.score === "number" &&
		typeof res.start === "number";
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{answer: string, end: number, score: number, start: number}>");
	}
	return res;
}
