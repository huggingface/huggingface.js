import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import type { RequestArgs } from "../../types";
import { base64FromBytes } from "../../../../shared/src/base64FromBytes";

export type DocumentQuestionAnsweringArgs = BaseArgs & {
	inputs: {
		/**
		 * Raw image
		 *
		 * You can use native `File` in browsers, or `new Blob([buffer])` in node, or for a base64 image `new Blob([btoa(base64String)])`, or even `await (await fetch('...)).blob()`
		 **/
		image: Blob;
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
	const reqArgs: RequestArgs = {
		...args,
		inputs: {
			question: args.inputs.question,
			// convert Blob to base64
			image: base64FromBytes(new Uint8Array(await args.inputs.image.arrayBuffer())),
		},
	} as RequestArgs;
	const res = (await request<[DocumentQuestionAnsweringOutput]>(reqArgs, options))?.[0];
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
