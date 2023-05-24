import type { InferenceTask, Options, RequestArgs } from "../types";
import { isUrl } from "./isUrl";

const HF_INFERENCE_API_BASE_URL = "https://api-inference.huggingface.co";

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
		/** When a model can be used for multiple tasks, and we want to run a non-default task */
		task?: string | InferenceTask;
	}
): { url: string; info: RequestInit } {
	const { model, accessToken, ...otherArgs } = args;
	const { task, includeCredentials, ...otherOptions } = options ?? {};

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

	const url = (() => {
		if (isUrl(model)) {
			return model;
		}

		if (task) {
			return `${HF_INFERENCE_API_BASE_URL}/pipeline/${task}/${model}`;
		}

		return `${HF_INFERENCE_API_BASE_URL}/models/${model}`;
	})();

	const info: RequestInit = {
		headers,
		method: "POST",
		body: binary
			? args.data
			: JSON.stringify({
					...otherArgs,
					options: options && otherOptions,
			  }),
		credentials: includeCredentials ? "include" : "same-origin",
	};

	return { url, info };
}
