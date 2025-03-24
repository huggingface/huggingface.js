/**
 * See the registered mapping of HF model ID => Featherless model ID here:
 *
 * https://huggingface.co/api/partners/featherless/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Featherless and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Featherless, please open an issue on the present repo
 * and we will tag Featherless team members.
 *
 * Thanks!
 */
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const FEATHERLESS_API_BASE_URL = "https://api.featherless.ai";

const makeBody = (params: BodyParams): Record<string, unknown> => {
	const { inputs, parameters, ...args } = params.args;

	if (inputs) {
		args.prompt = inputs;
	}

	return {
		...args,
		...(parameters as object),
		model: params.model,
	};
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl = (params: UrlParams): string => {
	if (params.chatCompletion) {
		return `${params.baseUrl}/v1/chat/completions`;
	}
	return `${params.baseUrl}/v1/completions`;
};

export const FEATHERLESS_AI_CONFIG: ProviderConfig = {
	baseUrl: FEATHERLESS_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
