import type { WidgetType } from "@huggingface/tasks";
import { HF_HUB_URL } from "../config";
import { FAL_AI_API_BASE_URL, FAL_AI_SUPPORTED_MODEL_IDS } from "../providers/fal-ai";
import { REPLICATE_API_BASE_URL, REPLICATE_SUPPORTED_MODEL_IDS } from "../providers/replicate";
import { SAMBANOVA_API_BASE_URL, SAMBANOVA_SUPPORTED_MODEL_IDS } from "../providers/sambanova";
import { TOGETHER_API_BASE_URL, TOGETHER_SUPPORTED_MODEL_IDS } from "../providers/together";
import type { InferenceProvider } from "../types";
import type { InferenceTask, Options, RequestArgs } from "../types";
import { isUrl } from "./isUrl";
import { version as packageVersion, name as packageName } from "../../package.json";

const HF_HUB_INFERENCE_PROXY_TEMPLATE = `${HF_HUB_URL}/api/inference-proxy/{{PROVIDER}}`;

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
	const { accessToken, endpointUrl, provider: maybeProvider, model: maybeModel, ...remainingArgs } = args;
	let otherArgs = remainingArgs;
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
			model = mapModel({ model: await loadDefaultModel(taskHint), provider, taskHint, chatCompletion });
		} else {
			throw new Error("No model provided, and no default model found for this task");
			/// TODO : change error message ^
		}
	} else {
		model = mapModel({ model: maybeModel, provider, taskHint, chatCompletion });
	}

	/// If accessToken is passed, it should take precedence over includeCredentials
	const authMethod = accessToken
		? accessToken.startsWith("hf_")
			? "hf-token"
			: "provider-key"
		: includeCredentials === "include"
		  ? "credentials-include"
		  : "none";

	const url = endpointUrl
		? chatCompletion
			? endpointUrl + `/v1/chat/completions`
			: endpointUrl
		: makeUrl({
				authMethod,
				chatCompletion: chatCompletion ?? false,
				forceTask,
				model,
				provider: provider ?? "hf-inference",
				taskHint,
		  });

	const headers: Record<string, string> = {};
	if (accessToken) {
		headers["Authorization"] =
			provider === "fal-ai" && authMethod === "provider-key" ? `Key ${accessToken}` : `Bearer ${accessToken}`;
	}

	// e.g. @huggingface/inference/3.1.3
	const ownUserAgent = `${packageName}/${packageVersion}`;
	headers["User-Agent"] = [ownUserAgent, typeof navigator !== "undefined" ? navigator.userAgent : undefined]
		.filter((x) => x !== undefined)
		.join(" ");

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

	/**
	 * Replicate models wrap all inputs inside { input: ... }
	 * Versioned Replicate models in the format `owner/model:version` expect the version in the body
	 */
	if (provider === "replicate") {
		const version = model.includes(":") ? model.split(":")[1] : undefined;
		(otherArgs as unknown) = { input: otherArgs, version };
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

function mapModel(params: {
	model: string;
	provider: InferenceProvider;
	taskHint: InferenceTask | undefined;
	chatCompletion: boolean | undefined;
}): string {
	if (params.provider === "hf-inference") {
		return params.model;
	}
	if (!params.taskHint) {
		throw new Error("taskHint must be specified when using a third-party provider");
	}
	const task: WidgetType =
		params.taskHint === "text-generation" && params.chatCompletion ? "conversational" : params.taskHint;
	const model = (() => {
		switch (params.provider) {
			case "fal-ai":
				return FAL_AI_SUPPORTED_MODEL_IDS[task]?.[params.model];
			case "replicate":
				return REPLICATE_SUPPORTED_MODEL_IDS[task]?.[params.model];
			case "sambanova":
				return SAMBANOVA_SUPPORTED_MODEL_IDS[task]?.[params.model];
			case "together":
				return TOGETHER_SUPPORTED_MODEL_IDS[task]?.[params.model];
		}
	})();

	if (!model) {
		throw new Error(`Model ${params.model} is not supported for task ${task} and provider ${params.provider}`);
	}
	return model;
}

function makeUrl(params: {
	authMethod: "none" | "hf-token" | "credentials-include" | "provider-key";
	chatCompletion: boolean;
	model: string;
	provider: InferenceProvider;
	taskHint: InferenceTask | undefined;
	forceTask?: string | InferenceTask;
}): string {
	if (params.authMethod === "none" && params.provider !== "hf-inference") {
		throw new Error("Authentication is required when requesting a third-party provider. Please provide accessToken");
	}

	const shouldProxy = params.provider !== "hf-inference" && params.authMethod !== "provider-key";
	switch (params.provider) {
		case "fal-ai": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: FAL_AI_API_BASE_URL;
			return `${baseUrl}/${params.model}`;
		}
		case "replicate": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: REPLICATE_API_BASE_URL;
			if (params.model.includes(":")) {
				/// Versioned model
				return `${baseUrl}/v1/predictions`;
			}
			/// Evergreen / Canonical model
			return `${baseUrl}/v1/models/${params.model}/predictions`;
		}
		case "sambanova": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: SAMBANOVA_API_BASE_URL;
			/// Sambanova API matches OpenAI-like APIs: model is defined in the request body
			if (params.taskHint === "text-generation" && params.chatCompletion) {
				return `${baseUrl}/v1/chat/completions`;
			}
			return baseUrl;
		}
		case "together": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: TOGETHER_API_BASE_URL;
			/// Together API matches OpenAI-like APIs: model is defined in the request body
			if (params.taskHint === "text-to-image") {
				return `${baseUrl}/v1/images/generations`;
			}
			if (params.taskHint === "text-generation") {
				if (params.chatCompletion) {
					return `${baseUrl}/v1/chat/completions`;
				}
				return `${baseUrl}/v1/completions`;
			}
			return baseUrl;
		}
		default: {
			const baseUrl = HF_HUB_INFERENCE_PROXY_TEMPLATE.replaceAll("{{PROVIDER}}", "hf-inference");
			const url = params.forceTask
				? `${baseUrl}/pipeline/${params.forceTask}/${params.model}`
				: `${baseUrl}/models/${params.model}`;
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
