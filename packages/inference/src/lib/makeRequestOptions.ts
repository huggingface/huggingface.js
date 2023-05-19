import type { Options, RequestArgs } from "../types";

export const HF_INFERENCE_API_BASE_URL = "https://api-inference.huggingface.co/";
export const HF_INFERENCE_API_PIPELINE_BASE_URL = `${HF_INFERENCE_API_BASE_URL}pipeline/`;
export const HF_INFERENCE_API_MODEL_BASE_URL = `${HF_INFERENCE_API_BASE_URL}models/`;

export function isModelTypeURL(model: string): boolean {
	return /^http(s?):/.test(model) || model.startsWith("/");
}

export function getPipelineURL(model: string, pipeline: string): string {
	return isModelTypeURL(model) ? model : `${HF_INFERENCE_API_PIPELINE_BASE_URL}${pipeline}/${model}`;
}

/**
 * Helper that prepares request arguments
 */
export function makeRequestOptions(
	args: RequestArgs & {
		data?: Blob | ArrayBuffer;
		stream?: boolean;
	},
	options?: Options & {
		/** For internal HF use, which is why it's not exposed in {@link Options} */
		includeCredentials?: boolean;
	}
): { url: string; info: RequestInit } {
	const { model, accessToken, ...otherArgs } = args;

	const headers: Record<string, string> = {};
	if (accessToken) {
		headers["Authorization"] = `Bearer ${accessToken}`;
	}

	const binary = "data" in args && !!args.data;

	if (!binary) {
		headers["Content-Type"] = "application/json";
	} else {
		if (options?.wait_for_model) {
			headers["X-Wait-For-Model"] = "true";
		}
		if (options?.use_cache === false) {
			headers["X-Use-Cache"] = "false";
		}
		if (options?.dont_load_model) {
			headers["X-Load-Model"] = "0";
		}
	}

	const url = isModelTypeURL(model) ? model : `${HF_INFERENCE_API_MODEL_BASE_URL}${model}`;
	const info: RequestInit = {
		headers,
		method: "POST",
		body: binary
			? args.data
			: JSON.stringify({
					...otherArgs,
					options,
			  }),
		credentials: options?.includeCredentials ? "include" : "same-origin",
	};

	return { url, info };
}
