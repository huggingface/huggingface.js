/**
 * See the registered mapping of HF model ID => Nebius model ID here:
 *
 * https://huggingface.co/api/partners/nebius/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Nebius and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Nebius, please open an issue on the present repo
 * and we will tag Nebius team members.
 *
 * Thanks!
 */
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const NEBIUS_API_BASE_URL = "https://api.studio.nebius.ai";

const makeBody = ({ args, model }: BodyParams): Record<string, unknown> => {
	return {
		...args,
		model,
	};
};

const makeHeaders = ({ accessToken }: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${accessToken}` };
};

const makeUrl = ({ baseUrl, taskHint, chatCompletion }: UrlParams): string => {
	if (taskHint === "text-to-image") {
		return `${baseUrl}/v1/images/generations`;
	}
	if (taskHint === "text-generation") {
		if (chatCompletion) {
			return `${baseUrl}/v1/chat/completions`;
		}
		return `${baseUrl}/v1/completions`;
	}
	return baseUrl;
};

export const nebiusConfig: ProviderConfig = {
	baseUrl: NEBIUS_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
