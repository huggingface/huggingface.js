import type { InferenceTask, Options, RequestArgs } from "../types";
import { HF_HUB_URL } from "./getDefaultTask";
import { isUrl } from "./isUrl";

const HF_INFERENCE_API_BASE_URL = "https://api-inference.huggingface.co";

/**
 * Loaded from huggingface.co/api/tasks if needed
 */
let tasks: Record<string, { models: { id: string }[] }> | null = null;

/**
 * Helper that prepares request arguments
 */
export async function makeRequestOptions(
	args: RequestArgs & {
		data?: Blob | ArrayBuffer;
		stream?: boolean;
	},
	options?: Options & {
		/** For internal HF use, which is why it's not exposed in {@link Options} */
		includeCredentials?: boolean;
		/** When a model can be used for multiple tasks, and we want to run a non-default task */
		forceTask?: string | InferenceTask;
		/** To load default model if needed */
		taskHint?: InferenceTask;
	}
): Promise<{ url: string; info: RequestInit }> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { accessToken, model: _model, ...otherArgs } = args;
	let { model } = args;
	const { forceTask: task, includeCredentials, taskHint, ...otherOptions } = options ?? {};

	const headers: Record<string, string> = {};
	if (accessToken) {
		headers["Authorization"] = `Bearer ${accessToken}`;
	}

	if (!model && !tasks && taskHint) {
		const res = await fetch(`${HF_HUB_URL}/api/tasks`);

		if (res.ok) {
			tasks = await res.json();
		}
	}

	if (!model && tasks && taskHint) {
		const taskInfo = tasks[taskHint];
		if (taskInfo) {
			model = taskInfo.models[0].id;
		}
	}

	if (!model) {
		throw new Error("No model provided, and no default model found for this task");
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
