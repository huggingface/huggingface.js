import type { QuestionAnsweringInput, QuestionAnsweringOutput } from "@huggingface/tasks";

import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type QuestionAnsweringArgs = BaseArgs & QuestionAnsweringInput;

/**
 * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
 */
export async function questionAnswering(
	args: QuestionAnsweringArgs,
	options?: Options
): Promise<QuestionAnsweringOutput[number]> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "question-answering");
	const { data: res } = await innerRequest<QuestionAnsweringOutput | QuestionAnsweringOutput[number]>(
		args,
		providerHelper,
		{
			...options,
			task: "question-answering",
		}
	);
	return providerHelper.getResponse(res);
}
