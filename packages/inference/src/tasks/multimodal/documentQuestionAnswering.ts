import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import type { RequestArgs } from "../../types";
import { toArray } from "../../utils/toArray";
import { base64FromBytes } from "../../utils/base64FromBytes";
import type { DocumentQuestionAnsweringInput, DocumentQuestionAnsweringOutput } from "@huggingface/tasks";

export type DocumentQuestionAnsweringArgs = BaseArgs & DocumentQuestionAnsweringInput;

/**
 * Answers a question on a document image. Recommended model: impira/layoutlm-document-qa.
 */
export async function documentQuestionAnswering(
	args: DocumentQuestionAnsweringArgs,
	options?: Options
): Promise<DocumentQuestionAnsweringOutput> {
	const reqArgs: RequestArgs = {
		...args,
		inputs: {
			question: args.inputs.question,
			// convert Blob or ArrayBuffer to base64
			image: base64FromBytes(new Uint8Array(await args.inputs.arrayBuffer())),
		},
	} as RequestArgs;
	const res = toArray(
		await request<[DocumentQuestionAnsweringOutput] | DocumentQuestionAnsweringOutput>(reqArgs, {
			...options,
			taskHint: "document-question-answering",
		})
	)?.[0];
	const isValidOutput =
		typeof res?.answer === "string" &&
		(typeof res.end === "number" || typeof res.end === "undefined") &&
		(typeof res.score === "number" || typeof res.score === "undefined") &&
		(typeof res.start === "number" || typeof res.start === "undefined");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{answer: string, end?: number, score?: number, start?: number}>");
	}
	return res;
}
