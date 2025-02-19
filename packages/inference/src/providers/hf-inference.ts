/**
 * HF-Inference do not have a mapping since all models use IDs from the Hub.
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
import { HF_ROUTER_URL } from "../config";
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const makeBody = ({ args, chatCompletion, model }: BodyParams): Record<string, unknown> => {
	return {
		...args,
		...(chatCompletion ? { model } : undefined),
	};
};

const makeHeaders = ({ accessToken }: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${accessToken}` };
};

const makeUrl = ({ baseUrl, chatCompletion, model, taskHint }: UrlParams): string => {
	if (taskHint && ["feature-extraction", "sentence-similarity"].includes(taskHint)) {
		/// when deployed on hf-inference, those two tasks are automatically compatible with one another.
		return `${baseUrl}/pipeline/${taskHint}/${model}`;
	}
	if (taskHint === "text-generation" && chatCompletion) {
		return `${baseUrl}/models/${model}/v1/chat/completions`;
	}
	return `${baseUrl}/models/${model}`;
};

export const HF_INFERENCE_CONFIG: ProviderConfig = {
	baseUrl: `${HF_ROUTER_URL}/hf-inference`,
	makeBody,
	makeHeaders,
	makeUrl,
};
