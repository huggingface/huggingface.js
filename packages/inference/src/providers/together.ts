/**
 * See the registered mapping of HF model ID => Together model ID here:
 *
 * https://huggingface.co/api/partners/together/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Together and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Together, please open an issue on the present repo
 * and we will tag Together team members.
 *
 * Thanks!
 */
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const TOGETHER_API_BASE_URL = "https://api.together.xyz";

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
	if (params.task === "text-to-image") {
		return `${params.baseUrl}/v1/images/generations`;
	}
	if (params.chatCompletion) {
		return `${params.baseUrl}/v1/chat/completions`;
	}
	if (params.task === "text-generation") {
		return `${params.baseUrl}/v1/completions`;
	}
	return params.baseUrl;
};

export const TOGETHER_CONFIG: ProviderConfig = {
	baseUrl: TOGETHER_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
