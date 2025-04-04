import type { QuestionAnsweringInput, QuestionAnsweringOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type QuestionAnsweringArgs = BaseArgs & QuestionAnsweringInput;

/**
 * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
 */
export async function questionAnswering(
	args: QuestionAnsweringArgs,
	options?: Options
): Promise<QuestionAnsweringOutput[number]> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "question-answering");
	const res = await request<QuestionAnsweringOutput | QuestionAnsweringOutput[number]>(args, {
		...options,
		task: "question-answering",
	});
	return providerHelper.getResponse(res);
}
