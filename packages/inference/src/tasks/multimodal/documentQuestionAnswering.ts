import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import type { RequestArgs } from "../../types";
import { toArray } from "../../utils/toArray";
import { base64FromBytes } from "../../utils/base64FromBytes";

export type DocumentQuestionAnsweringArgs = BaseArgs & {
	inputs: {
		/**
		 * Raw image
		 *
		 * You can use native `File` in browsers, or `new Blob([buffer])` in node, or for a base64 image `new Blob([btoa(base64String)])`, or even `await (await fetch('...)).blob()`
		 **/
		image: Blob | ArrayBuffer;
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
	end?: number;
	/**
	 * A float that represents how likely that the answer is correct
	 */
	score?: number;
	/**
	 * ?
	 */
	start?: number;
}

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
			image: base64FromBytes(
				new Uint8Array(
					args.inputs.image instanceof ArrayBuffer ? args.inputs.image : await args.inputs.image.arrayBuffer()
				)
			),
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
