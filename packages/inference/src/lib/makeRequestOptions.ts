import type { InferenceTask, Options, RequestArgs } from "../types";

const HF_INFERENCE_API_BASE_URL = "https://api-inference.huggingface.co";
const HF_HUB_URL = "https://huggingface.co";

/**
 * We want to make calls to the huggingface hub the least possible, eg if
 * someone is calling the inference API 1000 times per second, we don't want
 * to make 1000 calls to the hub to get the task name.
 */
const taskCache = new Map<string, { task: string | null; date: Date }>();
const CACHE_DURATION = 10 * 60 * 1000;
const MAX_CACHE_ITEMS = 1000;

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
		task?: string | InferenceTask;
	}
): Promise<{ url: string; info: RequestInit }> {
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

	const url = await (async () => {
		// If model is an URL, do not change it
		if (/^http(s?):/.test(model) || model.startsWith("/")) {
			return model;
		}

		if (task) {
			const key = `${model}:${accessToken}`;
			let cachedTask = taskCache.get(key);

			if (cachedTask && cachedTask.date < new Date(Date.now() - CACHE_DURATION)) {
				taskCache.delete(key);
				cachedTask = undefined;
			}

			if (cachedTask === undefined) {
				const modelTask = await fetch(`${HF_HUB_URL}/api/models/${model}?expand[]=pipeline_tag`, {
					headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
				})
					.then((resp) => resp.json())
					.then((json) => json.pipeline_tag)
					.catch(() => null);

				cachedTask = { task: modelTask, date: new Date() };
				taskCache.set(key, { task: modelTask, date: new Date() });

				if (taskCache.size > MAX_CACHE_ITEMS) {
					taskCache.delete(taskCache.keys().next().value);
				}
			}

			/*
			 * We only want to use the pipeline endpoint if the task is different, because
			 * the pipeline endpoint is does not have benefits like failing early or with
			 * a more explicit error message when the model does not match the task.
			 */
			if (cachedTask.task !== task) {
				return `${HF_INFERENCE_API_BASE_URL}/pipeline/${task}/${model}`;
			}
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
