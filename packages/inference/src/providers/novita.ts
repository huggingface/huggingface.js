/**
 * See the registered mapping of HF model ID => Novita model ID here:
 *
 * https://huggingface.co/api/partners/novita/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Novita and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Novita, please open an issue on the present repo
 * and we will tag Novita team members.
 *
 * Thanks!
 */
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const NOVITA_API_BASE_URL = "https://api.novita.ai/v3/openai";

const makeBody = ({ args, chatCompletion, model }: BodyParams): unknown => {
	return {
		...args,
		...(chatCompletion ? { model } : undefined),
	};
};

const makeHeaders = ({ accessToken }: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${accessToken}` };
};

const makeUrl = ({ baseUrl, taskHint, chatCompletion }: UrlParams): string => {
	if (taskHint === "text-generation") {
		if (chatCompletion) {
			return `${baseUrl}/chat/completions`;
		}
		return `${baseUrl}/completions`;
	}
	return baseUrl;
};

export const novitaConfig: ProviderConfig = {
	baseUrl: NOVITA_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
