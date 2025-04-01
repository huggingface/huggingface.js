/**
 * See the registered mapping of HF model ID => Cohere model ID here:
 *
 * https://huggingface.co/api/partners/cohere/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Cohere and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Cohere, please open an issue on the present repo
 * and we will tag Cohere team members.
 *
 * Thanks!
 */
import type { BodyParams, HeaderParams, ProviderConfig, UrlParams } from "../types";

const COHERE_API_BASE_URL = "https://api.cohere.com";

const makeBaseUrl = (): string => {
	return COHERE_API_BASE_URL;
};

const makeBody = (params: BodyParams): Record<string, unknown> => {
	return {
		...params.args,
		model: params.model,
	};
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl = (params: UrlParams): string => {
	return `${params.baseUrl}/compatibility/v1/chat/completions`;
};

export const COHERE_CONFIG: ProviderConfig = {
	makeBaseUrl,
	makeBody,
	makeHeaders,
	makeUrl,
};
