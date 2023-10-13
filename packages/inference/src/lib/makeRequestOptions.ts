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

	// Let users configure credentials, or disable them all together (or keep default behavior).
	// ---
	// This used to be an internal property only and never exposed to users. This means that most usages will never define this value
	// So in order to make this backwards compatible, if it's undefined we go to "same-origin" (default behaviour before).
	// If it's a boolean and set to true then set to "include". If false, don't define credentials at all (useful for edge runtimes)
	// Then finally, if it's a string, use it as-is.
	let credentials: RequestCredentials | undefined;
	if (typeof includeCredentials === "string") {
		credentials = includeCredentials as RequestCredentials;
	} else if (typeof includeCredentials === "boolean") {
		credentials = includeCredentials ? "include" : undefined;
	} else if (includeCredentials === undefined) {
		credentials = "same-origin";
	}

	const info: RequestInit = {
		headers,
		method: "POST",
		body: binary
			? args.data
			: JSON.stringify({
					...otherArgs,
					options: options && otherOptions,
			  }),
		credentials,
		signal: options?.signal,
	};

	return { url, info };
}
