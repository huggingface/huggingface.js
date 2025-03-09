/**
 * See the registered mapping of HF model ID => Fal model ID here:
 *
 * https://huggingface.co/api/partners/fal-ai/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Fal and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Fal, please open an issue on the present repo
 * and we will tag Fal team members.
 *
 * Thanks!
 */
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const FAL_AI_API_BASE_URL = "https://fal.run";

const makeBody = (params: BodyParams): Record<string, unknown> => {
	return params.args;
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	return {
		Authorization: params.authMethod === "provider-key" ? `Key ${params.accessToken}` : `Bearer ${params.accessToken}`,
	};
};

const makeUrl = (params: UrlParams): string => {
	return `${params.baseUrl}/${params.model}`;
};

export const FAL_AI_CONFIG: ProviderConfig = {
	baseUrl: FAL_AI_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
