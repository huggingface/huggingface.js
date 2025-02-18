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

const makeBody = ({ args, model }: BodyParams): Record<string, unknown> => {
	// const version =
	return {
		input: args,
		version: model.includes(":") ? model.split(":")[1] : undefined,
	};
};

const makeHeaders = ({ accessToken }: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${accessToken}` };
};

const makeUrl = ({ baseUrl, model }: UrlParams): string => {
	if (model.includes(":")) {
		/// Versioned model
		return `${baseUrl}/v1/predictions`;
	}
	/// Evergreen / Canonical model
	return `${baseUrl}/v1/models/${model}/predictions`;
};

export const replicateConfig: ProviderConfig = {
	baseUrl: REPLICATE_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};
