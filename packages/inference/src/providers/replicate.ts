/**
 * See the registered mapping of HF model ID => Replicate model ID here:
 *
 * https://huggingface.co/api/partners/replicate/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Replicate and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Replicate, please open an issue on the present repo
 * and we will tag Replicate team members.
 *
 * Thanks!
 */
import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

export const REPLICATE_API_BASE_URL = "https://api.replicate.com";

const makeBody = (params: BodyParams): Record<string, unknown> => {
	return {
		input: params.args,
		version: params.model.includes(":") ? params.model.split(":")[1] : undefined,
	};
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${params.accessToken}`, Prefer: "wait" };
};

const makeUrl = (params: UrlParams): string => {
	if (params.model.includes(":")) {
		/// Versioned model
		return `${params.baseUrl}/v1/predictions`;
	}
	/// Evergreen / Canonical model
	return `${params.baseUrl}/v1/models/${params.model}/predictions`;
};

export const REPLICATE_CONFIG: ProviderConfig = {
	baseUrl: REPLICATE_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
