import type { TableQuestionAnsweringInput, TableQuestionAnsweringOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type TableQuestionAnsweringArgs = BaseArgs & TableQuestionAnsweringInput;

/**
 * Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.
 */
export async function tableQuestionAnswering(
	args: TableQuestionAnsweringArgs,
	options?: Options
): Promise<TableQuestionAnsweringOutput[number]> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "table-question-answering");
	const { data: res } = await innerRequest<TableQuestionAnsweringOutput | TableQuestionAnsweringOutput[number]>(
		args,
		providerHelper,
		{
			...options,
			task: "table-question-answering",
		}
	);
	return providerHelper.getResponse(res);
}
