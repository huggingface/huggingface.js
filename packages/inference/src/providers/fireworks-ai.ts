/**
 * See the registered mapping of HF model ID => Fireworks model ID here:
 *
 * https://huggingface.co/api/partners/fireworks/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Fireworks and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Fireworks, please open an issue on the present repo
 * and we will tag Fireworks team members.
 *
 * Thanks!
 */
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const FIREWORKS_AI_API_BASE_URL = "https://api.fireworks.ai";

const makeBody = (params: BodyParams): Record<string, unknown> => {
	return {
		...params.args,
		...(params.chatCompletion ? { model: params.model } : undefined),
	};
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl = (params: UrlParams): string => {
	if (params.chatCompletion) {
		return `${params.baseUrl}/inference/v1/chat/completions`;
	}
	return `${params.baseUrl}/inference`;
};

export const FIREWORKS_AI_CONFIG: ProviderConfig = {
	baseUrl: FIREWORKS_AI_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
