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
import type { InferenceProvider } from "../types";

const NEBIUS_API_BASE_URL = "https://api.studio.nebius.ai";

const makeBaseUrl: InferenceProvider.MakeBaseUrl = () => {
	return NEBIUS_API_BASE_URL;
};

const makeBody: InferenceProvider.MakeBody = (params) => {
	return {
		...params.args,
		model: params.model,
	};
};

const makeHeaders: InferenceProvider.MakeHeaders = (params) => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl: InferenceProvider.MakeUrl = (params) => {
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

export const NEBIUS_CONFIG: InferenceProvider.Config = {
	makeBaseUrl,
	makeBody,
	makeHeaders,
	makeUrl,
};
