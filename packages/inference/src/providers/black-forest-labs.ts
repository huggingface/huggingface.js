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

const BLACK_FOREST_LABS_AI_API_BASE_URL = "https://api.us1.bfl.ai";

const makeBody = (params: BodyParams): Record<string, unknown> => {
	return params.args;
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	if (params.authMethod === "provider-key") {
		return { "X-Key": `${params.accessToken}` };
	} else {
		return { Authorization: `Bearer ${params.accessToken}` };
	}
};

const makeUrl = (params: UrlParams): string => {
	return `${params.baseUrl}/v1/${params.model}`;
};

export const BLACK_FOREST_LABS_CONFIG: ProviderConfig = {
	baseUrl: BLACK_FOREST_LABS_AI_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
