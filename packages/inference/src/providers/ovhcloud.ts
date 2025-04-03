/**
 * See the registered mapping of HF model ID => OVHcloud model ID here:
 *
 * https://huggingface.co/api/partners/ovhcloud/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at OVHcloud and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to OVHcloud, please open an issue on the present repo
 * and we will tag OVHcloud team members.
 *
 * Thanks!
 */
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const OVHCLOUD_API_BASE_URL = "https://oai.endpoints.kepler.ai.cloud.ovh.net";

const makeBody = (params: BodyParams): Record<string, unknown> => {
	return {
		...params.args,
		model: params.model,
	};
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl = (params: UrlParams): string => {
	return `${params.baseUrl}/v1/chat/completions`;
};

export const OVHCLOUD_CONFIG: ProviderConfig = {
	baseUrl: OVHCLOUD_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
