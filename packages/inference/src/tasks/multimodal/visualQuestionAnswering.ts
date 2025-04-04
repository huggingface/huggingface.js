import type {
	VisualQuestionAnsweringInput,
	VisualQuestionAnsweringInputData,
	VisualQuestionAnsweringOutput,
} from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options, RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
import { innerRequest } from "../../utils/request";

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
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "visual-question-answering");
	const reqArgs: RequestArgs = {
		...args,
		inputs: {
			question: args.inputs.question,
			// convert Blob or ArrayBuffer to base64
			image: base64FromBytes(new Uint8Array(await args.inputs.image.arrayBuffer())),
		},
	} as RequestArgs;

	const { data: res } = await innerRequest<VisualQuestionAnsweringOutput>(reqArgs, {
		...options,
		task: "visual-question-answering",
	});
	return providerHelper.getResponse(res);
}
