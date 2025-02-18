/**
 * See the registered mapping of HF model ID => Black Forest Labs model ID here:
 *
 * https://huggingface.co/api/partners/blackforestlabs/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Black Forest Labs and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Black Forest Labs, please open an issue on the present repo
 * and we will tag Black Forest Labs team members.
 *
 * Thanks!
 */
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const BLACKFORESTLABS_AI_API_BASE_URL = "https://api.us1.bfl.ai/v1";

const makeBody = ({ args }: BodyParams): unknown => {
	return args;
};

const makeHeaders = ({ accessToken, authMethod }: HeaderParams): Record<string, string> => {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (authMethod === "provider-key") {
		headers["X-Key"] = `${accessToken}`;
	} else {
		headers["Authorization"] = `Bearer ${accessToken}`;
	}
	return headers;
};

const makeUrl = ({ baseUrl, model }: UrlParams): string => {
	return `${baseUrl}/${model}`;
};

export const blackForestLabsConfig: ProviderConfig = {
	baseUrl: BLACKFORESTLABS_AI_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
