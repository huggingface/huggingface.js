import type {
	DocumentQuestionAnsweringInput,
	DocumentQuestionAnsweringInputData,
	DocumentQuestionAnsweringOutput,
} from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options, RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
import { innerRequest } from "../../utils/request";
import { toArray } from "../../utils/toArray";

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
	const { data: res } = await innerRequest<DocumentQuestionAnsweringOutput | DocumentQuestionAnsweringOutput[number]>(
		reqArgs,
		{
			...options,
			task: "document-question-answering",
		}
	);
	const output = toArray(res);
	const isValidOutput =
		Array.isArray(output) &&
		output.every(
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

	return output[0];
}
