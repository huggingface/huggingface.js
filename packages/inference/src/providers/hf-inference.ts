/**
 * HF-Inference do not have a mapping since all models use IDs from the Hub.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at HF and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to HF, please open an issue on the present repo
 * and we will tag HF team members.
 *
 * Thanks!
 */
import { HF_ROUTER_URL } from "../config";
import type { BodyParams, HeaderParams, ProviderConfig, UrlParams } from "../types";

const makeBaseUrl = (): string => {
	return `${HF_ROUTER_URL}/hf-inference`;
};

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
	if (params.task && ["feature-extraction", "sentence-similarity"].includes(params.task)) {
		/// when deployed on hf-inference, those two tasks are automatically compatible with one another.
		return `${params.baseUrl}/pipeline/${params.task}/${params.model}`;
	}
	if (params.chatCompletion) {
		return `${params.baseUrl}/models/${params.model}/v1/chat/completions`;
	}
	return `${params.baseUrl}/models/${params.model}`;
};

export const HF_INFERENCE_CONFIG: ProviderConfig = {
	makeBaseUrl,
	makeBody,
	makeHeaders,
	makeUrl,
};
