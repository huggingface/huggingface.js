import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import type { RequestArgs } from "../../types";
import { toArray } from "../../utils/toArray";
import { base64FromBytes } from "../../utils/base64FromBytes";
import type {
	DocumentQuestionAnsweringInput,
	DocumentQuestionAnsweringInputData,
	DocumentQuestionAnsweringOutput,
} from "@huggingface/tasks";

/// Override the type to properly set inputs.image as Blob
export type DocumentQuestionAnsweringArgs = BaseArgs &
	DocumentQuestionAnsweringInput & { inputs: DocumentQuestionAnsweringInputData & { image: Blob } };

/**
 * Answers a question on a document image. Recommended model: impira/layoutlm-document-qa.
 */
export async function documentQuestionAnswering(
	args: DocumentQuestionAnsweringArgs,
	options?: Options
): Promise<DocumentQuestionAnsweringOutput[number]> {
	const reqArgs: RequestArgs = {
		...args,
		inputs: {
			question: args.inputs.question,
			// convert Blob or ArrayBuffer to base64
			image: base64FromBytes(new Uint8Array(await args.inputs.image.arrayBuffer())),
		},
	} as RequestArgs;
	const res = toArray(
		await request<DocumentQuestionAnsweringOutput | DocumentQuestionAnsweringOutput[number]>(reqArgs, {
			...options,
			taskHint: "document-question-answering",
		})
	);

	const isValidOutput =
		Array.isArray(res) &&
		res.every(
			(elem) =>
				typeof elem === "object" &&
				!!elem &&
				typeof elem?.answer === "string" &&
				(typeof elem.end === "number" || typeof elem.end === "undefined") &&
				(typeof elem.score === "number" || typeof elem.score === "undefined") &&
				(typeof elem.start === "number" || typeof elem.start === "undefined")
		);
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{answer: string, end?: number, score?: number, start?: number}>");
	}

	return res[0];
}
