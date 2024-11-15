import type { InferenceTask, Options, RequestArgs } from "../types";
import { omit } from "../utils/omit";
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
		chatCompletion?: boolean;
	}
): Promise<{ url: string; info: RequestInit }> {
	const { accessToken, endpointUrl, ...otherArgs } = args;
	let { model } = args;
	const {
		forceTask: task,
		includeCredentials,
		taskHint,
		wait_for_model,
		use_cache,
		dont_load_model,
		chatCompletion,
	} = options ?? {};

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
	}

	if (wait_for_model) {
		headers["X-Wait-For-Model"] = "true";
	}
	if (use_cache === false) {
		headers["X-Use-Cache"] = "false";
	}
	if (dont_load_model) {
		headers["X-Load-Model"] = "0";
	}

	let url = (() => {
		if (endpointUrl && isUrl(model)) {
			throw new TypeError("Both model and endpointUrl cannot be URLs");
		}
		if (isUrl(model)) {
			console.warn("Using a model URL is deprecated, please use the `endpointUrl` parameter instead");
			return model;
		}
		if (endpointUrl) {
			return endpointUrl;
		}
		if (task) {
			return `${HF_INFERENCE_API_BASE_URL}/pipeline/${task}/${model}`;
		}

		return `${HF_INFERENCE_API_BASE_URL}/models/${model}`;
	})();

	if (chatCompletion && !url.endsWith("/chat/completions")) {
		url += "/v1/chat/completions";
	}

	/**
	 * For edge runtimes, leave 'credentials' undefined, otherwise cloudflare workers will error
	 */
	let credentials: RequestCredentials | undefined;
	if (typeof includeCredentials === "string") {
		credentials = includeCredentials as RequestCredentials;
	} else if (includeCredentials === true) {
		credentials = "include";
	}

	const info: RequestInit = {
		headers,
		method: "POST",
		body: binary
			? args.data
			: JSON.stringify({
					...(otherArgs.model && isUrl(otherArgs.model) ? omit(otherArgs, "model") : otherArgs),
			  }),
		...(credentials && { credentials }),
		signal: options?.signal,
	};

	return { url, info };
}
