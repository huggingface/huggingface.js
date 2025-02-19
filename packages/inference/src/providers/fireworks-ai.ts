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

const FIREWORKS_AI_API_BASE_URL = "https://api.fireworks.ai/inference";

const makeBody = ({ args, chatCompletion, model }: BodyParams): Record<string, unknown> => {
	return {
		...args,
		...(chatCompletion ? { model } : undefined),
	};
};

const makeHeaders = ({ accessToken }: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${accessToken}` };
};

const makeUrl = ({ baseUrl, taskHint, chatCompletion }: UrlParams): string => {
	if (taskHint === "text-generation" && chatCompletion) {
		return `${baseUrl}/v1/chat/completions`;
	}
	return baseUrl;
};

export const FIREWORKS_AI_CONFIG: ProviderConfig = {
	baseUrl: FIREWORKS_AI_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
