import type { TokenClassificationInput, TokenClassificationOutput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type TokenClassificationArgs = BaseArgs & TokenClassificationInput;

/**
 * Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english
 */
export async function tokenClassification(
	args: TokenClassificationArgs,
	options?: Options
): Promise<TokenClassificationOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "token-classification");
	const { data: res } = await innerRequest<TokenClassificationOutput[number] | TokenClassificationOutput>(
		args,
		providerHelper,
		{
			...options,
			task: "token-classification",
		}
	);
	return providerHelper.getResponse(res);
}
