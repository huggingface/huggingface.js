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
import type { InferenceProviderTypes } from "./types";

const TOGETHER_API_BASE_URL = "https://api.together.xyz";

const makeBaseUrl: InferenceProviderTypes.MakeBaseUrl = () => {
	return TOGETHER_API_BASE_URL;
};

const makeBody: InferenceProviderTypes.MakeBody = (params) => {
	return {
		...params.args,
		model: params.model,
	};
};

const makeHeaders: InferenceProviderTypes.MakeHeaders = (params) => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl: InferenceProviderTypes.MakeUrl = (params) => {
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

export const TOGETHER_CONFIG: InferenceProviderTypes.Config = {
	makeBaseUrl,
	makeBody,
	makeHeaders,
	makeUrl,
};
