import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options, RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
import { request } from "../custom/request";

export type VisualQuestionAnsweringArgs = BaseArgs & {
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

export interface VisualQuestionAnsweringOutput {
	/**
	 * A string that’s the answer to a visual question.
	 */
	answer: string;
	/**
	 * Answer correctness score.
	 */
	score: number;
}

/**
 * Answers a question on an image. Recommended model: dandelin/vilt-b32-finetuned-vqa.
 */
export async function visualQuestionAnswering(
	args: VisualQuestionAnsweringArgs,
	options?: Options
): Promise<VisualQuestionAnsweringOutput> {
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
	const res = (
		await request<[VisualQuestionAnsweringOutput]>(reqArgs, {
			...options,
			taskHint: "visual-question-answering",
		})
	)?.[0];
	const isValidOutput = typeof res?.answer === "string" && typeof res.score === "number";
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{answer: string, score: number}>");
	}
	return res;
}
