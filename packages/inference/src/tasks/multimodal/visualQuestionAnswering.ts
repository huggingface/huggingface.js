import type {
	VisualQuestionAnsweringInput,
	VisualQuestionAnsweringInputData,
	VisualQuestionAnsweringOutput,
} from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options, RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
import { request } from "../custom/request";

/// Override the type to properly set inputs.image as Blob
export type VisualQuestionAnsweringArgs = BaseArgs &
	VisualQuestionAnsweringInput & { inputs: VisualQuestionAnsweringInputData & { image: Blob } };

/**
 * Answers a question on an image. Recommended model: dandelin/vilt-b32-finetuned-vqa.
 */
export async function visualQuestionAnswering(
	args: VisualQuestionAnsweringArgs,
	options?: Options
): Promise<VisualQuestionAnsweringOutput[number]> {
	const reqArgs: RequestArgs = {
		...args,
		inputs: {
			question: args.inputs.question,
			// convert Blob or ArrayBuffer to base64
			image: base64FromBytes(new Uint8Array(await args.inputs.image.arrayBuffer())),
		},
	} as RequestArgs;
	const res = await request<VisualQuestionAnsweringOutput>(reqArgs, {
		...options,
		taskHint: "visual-question-answering",
	});
	const isValidOutput =
		Array.isArray(res) &&
		res.every(
			(elem) => typeof elem === "object" && !!elem && typeof elem?.answer === "string" && typeof elem.score === "number"
		);
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{answer: string, score: number}>");
	}
	return res[0];
}
