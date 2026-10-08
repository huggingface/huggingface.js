import type { TextRankingInput, TextRankingOutput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import type { BaseArgs, Options } from "../../types.js";
import { innerRequest } from "../../utils/request.js";

export type TextRankingArgs = BaseArgs & TextRankingInput;

/**
 * Rank documents by their relevance to a query using a reranker model.
 */
export async function textRanking(args: TextRankingArgs, options?: Options): Promise<TextRankingOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl, options);
	const providerHelper = getProviderHelper(provider, "text-ranking");
	const { data: res } = await innerRequest<TextRankingOutput>(args, providerHelper, {
		...options,
		task: "text-ranking",
	});
	return providerHelper.getResponse(res);
}
