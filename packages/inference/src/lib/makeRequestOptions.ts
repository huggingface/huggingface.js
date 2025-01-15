import { FAL_AI_API_BASE_URL, FAL_AI_MODEL_IDS } from "../providers/fal-ai";
import { REPLICATE_API_BASE_URL, REPLICATE_MODEL_IDS } from "../providers/replicate";
import { SAMBANOVA_API_BASE_URL, SAMBANOVA_MODEL_IDS } from "../providers/sambanova";
import { TOGETHER_API_BASE_URL, TOGETHER_MODEL_IDS } from "../providers/together";
import type { InferenceProvider } from "../types";
import type { InferenceTask, Options, RequestArgs } from "../types";
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
	const { accessToken, endpointUrl, provider: maybeProvider, model: maybeModel, ...otherArgs } = args;
	const provider = maybeProvider ?? "hf-inference";

	const { forceTask, includeCredentials, taskHint, wait_for_model, use_cache, dont_load_model, chatCompletion } =
		options ?? {};

	if (endpointUrl && provider !== "hf-inference") {
		throw new Error(`Cannot use endpointUrl with a third-party provider.`);
	}
	if (forceTask && provider !== "hf-inference") {
		throw new Error(`Cannot use forceTask with a third-party provider.`);
	}
	if (maybeModel && isUrl(maybeModel)) {
		throw new Error(`Model URLs are no longer supported. Use endpointUrl instead.`);
	}

	let model: string;
	if (!maybeModel) {
		if (taskHint) {
			model = mapModel({ model: await loadDefaultModel(taskHint), provider });
		} else {
			throw new Error("No model provided, and no default model found for this task");
			/// TODO : change error message ^
		}
	} else {
		model = mapModel({ model: maybeModel, provider });
	}

	const url = endpointUrl
		? chatCompletion
			? endpointUrl + `/v1/chat/completions`
			: endpointUrl
		: makeUrl({
				model,
				provider: provider ?? "hf-inference",
				taskHint,
				chatCompletion: chatCompletion ?? false,
				forceTask,
		  });

	const headers: Record<string, string> = {};
	if (accessToken) {
		headers["Authorization"] = provider === "fal-ai" ? `Key ${accessToken}` : `Bearer ${accessToken}`;
	}

	const binary = "data" in args && !!args.data;

	if (!binary) {
		headers["Content-Type"] = "application/json";
	}

	if (provider === "hf-inference") {
		if (wait_for_model) {
			headers["X-Wait-For-Model"] = "true";
		}
		if (use_cache === false) {
			headers["X-Use-Cache"] = "false";
		}
		if (dont_load_model) {
			headers["X-Load-Model"] = "0";
		}
	}

	if (provider === "replicate") {
		headers["Prefer"] = "wait";
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
		(otherArgs as typeof otherArgs & { version: string }).version = version;
	}

	const info: RequestInit = {
		headers,
		method: "POST",
		body: binary
			? args.data
			: JSON.stringify({
					...otherArgs,
					...(chatCompletion || provider === "together" ? { model } : undefined),
			  }),
		...(credentials ? { credentials } : undefined),
		signal: options?.signal,
	};

	return { url, info };
}

function mapModel(params: { model: string; provider: InferenceProvider }): string {
	const model = (() => {
		switch (params.provider) {
			case "fal-ai":
				return FAL_AI_MODEL_IDS[params.model];
			case "replicate":
				return REPLICATE_MODEL_IDS[params.model];
			case "sambanova":
				return SAMBANOVA_MODEL_IDS[params.model];
			case "together":
				return TOGETHER_MODEL_IDS[params.model]?.id;
			case "hf-inference":
				return params.model;
		}
	})();

	if (!model) {
		throw new Error(`Model ${params.model} is not supported for provider ${params.provider}`);
	}
	return model;
}

function makeUrl(params: {
	model: string;
	provider: InferenceProvider;
	taskHint: InferenceTask | undefined;
	chatCompletion: boolean;
	forceTask?: string | InferenceTask;
}): string {
	switch (params.provider) {
		case "fal-ai":
			return `${FAL_AI_API_BASE_URL}/${params.model}`;
		case "replicate": {
			if (params.model.includes(":")) {
				/// Versioned model
				return `${REPLICATE_API_BASE_URL}/v1/predictions`;
			}
			/// Evergreen / Canonical model
			return `${REPLICATE_API_BASE_URL}/v1/models/${params.model}/predictions`;
		}
		case "sambanova":
			/// Sambanova API matches OpenAI-like APIs: model is defined in the request body
			if (params.taskHint === "text-generation" && params.chatCompletion) {
				return `${SAMBANOVA_API_BASE_URL}/v1/chat/completions`;
			}
			return SAMBANOVA_API_BASE_URL;
		case "together": {
			/// Together API matches OpenAI-like APIs: model is defined in the request body
			if (params.taskHint === "text-to-image") {
				return `${TOGETHER_API_BASE_URL}/v1/images/generations`;
			}
			if (params.taskHint === "text-generation") {
				if (params.chatCompletion) {
					return `${TOGETHER_API_BASE_URL}/v1/chat/completions`;
				}
				return `${TOGETHER_API_BASE_URL}/v1/completions`;
			}
			return TOGETHER_API_BASE_URL;
		}
		default: {
			const url = params.forceTask
				? `${HF_INFERENCE_API_BASE_URL}/pipeline/${params.forceTask}/${params.model}`
				: `${HF_INFERENCE_API_BASE_URL}/models/${params.model}`;
			if (params.taskHint === "text-generation" && params.chatCompletion) {
				return url + `/v1/chat/completions`;
			}
			return url;
		}
	}
}
async function loadDefaultModel(task: InferenceTask): Promise<string> {
	if (!tasks) {
		tasks = await loadTaskInfo();
	}
	const taskInfo = tasks[task];
	if ((taskInfo?.models.length ?? 0) <= 0) {
		throw new Error(`No default model defined for task ${task}, please define the model explicitly.`);
	}
	return taskInfo.models[0].id;
}

async function loadTaskInfo(): Promise<Record<string, { models: { id: string }[] }>> {
	const res = await fetch(`${HF_HUB_URL}/api/tasks`);

	if (!res.ok) {
		throw new Error("Failed to load tasks definitions from Hugging Face Hub.");
	}
	return await res.json();
}
