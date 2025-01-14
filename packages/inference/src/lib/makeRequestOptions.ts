import { FAL_AI_API_BASE_URL, FAL_AI_MODEL_IDS } from "../providers/fal-ai";
import { REPLICATE_API_BASE_URL, REPLICATE_MODEL_IDS } from "../providers/replicate";
import { SAMBANOVA_API_BASE_URL, SAMBANOVA_MODEL_IDS } from "../providers/sambanova";
import { TOGETHER_API_BASE_URL, TOGETHER_MODEL_IDS } from "../providers/together";
import { INFERENCE_PROVIDERS, type InferenceTask, type Options, type RequestArgs } from "../types";
import { omit } from "../utils/omit";
import { HF_HUB_URL } from "./getDefaultTask";
import { isUrl } from "./isUrl";

const HF_INFERENCE_API_BASE_URL = "https://api-inference.huggingface.co";

/**
 * Lazy-loaded from huggingface.co/api/tasks when needed
 * Used to determine the default model to use when it's not user defined
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
	const { accessToken, endpointUrl, provider, ...otherArgs } = args;
	let { model } = args;
	const { forceTask, includeCredentials, taskHint, wait_for_model, use_cache, dont_load_model, chatCompletion } =
		options ?? {};

	const headers: Record<string, string> = {};
	if (accessToken) {
		headers["Authorization"] = provider === "fal-ai" ? `Key ${accessToken}` : `Bearer ${accessToken}`;
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
	if (provider) {
		if (!INFERENCE_PROVIDERS.includes(provider)) {
			throw new Error("Unknown Inference provider");
		}
		if (!accessToken) {
			throw new Error("Specifying an Inference provider requires an accessToken");
		}

		const modelId = (() => {
			switch (provider) {
				case "replicate":
					return REPLICATE_MODEL_IDS[model];
				case "sambanova":
					return SAMBANOVA_MODEL_IDS[model];
				case "together":
					return TOGETHER_MODEL_IDS[model]?.id;
				case "fal-ai":
					return FAL_AI_MODEL_IDS[model];
				default:
					return model;
			}
		})();

		if (!modelId) {
			throw new Error(`Model ${model} is not supported for provider ${provider}`);
		}

		model = modelId;
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
	if (provider === "replicate") {
		headers["Prefer"] = "wait";
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
		if (forceTask) {
			return `${HF_INFERENCE_API_BASE_URL}/pipeline/${forceTask}/${model}`;
		}
		if (provider) {
			if (!accessToken) {
				throw new Error("Specifying an Inference provider requires an accessToken");
			}
			if (accessToken.startsWith("hf_")) {
				/// TODO we wil proxy the request server-side (using our own keys) and handle billing for it on the user's HF account.
				throw new Error("Inference proxying is not implemented yet");
			} else {
				switch (provider) {
					case "fal-ai":
						return `${FAL_AI_API_BASE_URL}/${model}`;
					case "replicate":
						if (model.includes(":")) {
							// Versioned models are in the form of `owner/model:version`
							return `${REPLICATE_API_BASE_URL}/v1/predictions/${model.split(":")[0]}`;
						} else {
							// Unversioned models are in the form of `owner/model`
							return `${REPLICATE_API_BASE_URL}/v1/models/${model}/predictions`;
						}
					case "sambanova":
						return SAMBANOVA_API_BASE_URL;
					case "together":
						if (taskHint === "text-to-image") {
							return `${TOGETHER_API_BASE_URL}/v1/images/generations`;
						}
						return TOGETHER_API_BASE_URL;
					default:
						break;
				}
			}
		}

		return `${HF_INFERENCE_API_BASE_URL}/models/${model}`;
	})();

	if (chatCompletion && !url.endsWith("/chat/completions")) {
		url += "/v1/chat/completions";
	}
	if (provider === "together" && taskHint === "text-generation" && !chatCompletion) {
		url += "/v1/completions";
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

	/* 
	 * Versioned Replicate models in the format `owner/model:version` expect the version in the body
	 */
	if (provider === "replicate" && model.includes(":")) {
		const version = model.split(":")[1];
		otherArgs.version = version;
	}

	const info: RequestInit = {
		headers,
		method: "POST",
		body: binary
			? args.data
			: JSON.stringify({
					...((otherArgs.model && isUrl(otherArgs.model)) || provider === "replicate" || provider === "fal-ai"
						? omit(otherArgs, "model")
						: { ...otherArgs, model }),
			  }),
		...(credentials ? { credentials } : undefined),
		signal: options?.signal,
	};

	return { url, info };
}
