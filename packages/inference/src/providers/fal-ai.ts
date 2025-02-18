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

const makeBody = ({ args }: BodyParams): unknown => {
	return args;
};

const makeHeaders = ({ accessToken, authMethod }: HeaderParams): Record<string, string> => {
	return {
		Authorization: authMethod === "provider-key" ? `Key ${accessToken}` : `Bearer ${accessToken}`,
	};
};

const makeUrl = ({ baseUrl, model }: UrlParams): string => {
	return `${baseUrl}/${model}`;
};

export const falAiConfig: ProviderConfig = {
	baseUrl: FAL_AI_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
