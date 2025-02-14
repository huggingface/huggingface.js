import { HF_HUB_URL, HF_ROUTER_URL } from "../config";
import { FAL_AI_API_BASE_URL } from "../providers/fal-ai";
import { NEBIUS_API_BASE_URL } from "../providers/nebius";
import { REPLICATE_API_BASE_URL } from "../providers/replicate";
import { SAMBANOVA_API_BASE_URL } from "../providers/sambanova";
import { TOGETHER_API_BASE_URL } from "../providers/together";
import { NOVITA_API_BASE_URL } from "../providers/novita";
import { FIREWORKS_AI_API_BASE_URL } from "../providers/fireworks-ai";
import { HYPERBOLIC_API_BASE_URL } from "../providers/hyperbolic";
import { BLACKFORESTLABS_AI_API_BASE_URL } from "../providers/black-forest-labs";
import type { InferenceProvider } from "../types";
import type { InferenceTask, Options, RequestArgs } from "../types";
import { isUrl } from "./isUrl";
import { version as packageVersion, name as packageName } from "../../package.json";
import { getProviderModelId } from "./getProviderModelId";

const HF_HUB_INFERENCE_PROXY_TEMPLATE = `${HF_ROUTER_URL}/{{PROVIDER}}`;

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
		/** To load default model if needed */
		taskHint?: InferenceTask;
		chatCompletion?: boolean;
	}
): Promise<{ url: string; info: RequestInit }> {
	const { accessToken, endpointUrl, provider: maybeProvider, model: maybeModel, ...remainingArgs } = args;
	let otherArgs = remainingArgs;
	const provider = maybeProvider ?? "hf-inference";

	const { includeCredentials, taskHint, chatCompletion } = options ?? {};

	if (endpointUrl && provider !== "hf-inference") {
		throw new Error(`Cannot use endpointUrl with a third-party provider.`);
	}
	if (maybeModel && isUrl(maybeModel)) {
		throw new Error(`Model URLs are no longer supported. Use endpointUrl instead.`);
	}
	if (!maybeModel && !taskHint) {
		throw new Error("No model provided, and no task has been specified.");
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const hfModel = maybeModel ?? (await loadDefaultModel(taskHint!));
	const model = await getProviderModelId({ model: hfModel, provider }, args, {
		taskHint,
		chatCompletion,
		fetch: options?.fetch,
	});

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
				model,
				provider: provider ?? "hf-inference",
				taskHint,
		  });

	const headers: Record<string, string> = {};
	if (accessToken) {
		if (provider === "fal-ai" && authMethod === "provider-key") {
			headers["Authorization"] = `Key ${accessToken}`;
		} else if (provider === "black-forest-labs" && authMethod === "provider-key") {
			headers["X-Key"] = accessToken;
		} else {
			headers["Authorization"] = `Bearer ${accessToken}`;
		}
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
					...(taskHint === "text-to-image" && provider === "hyperbolic"
						? { model_name: model }
						: chatCompletion || provider === "together" || provider === "nebius" || provider === "hyperbolic"
						  ? { model }
						  : undefined),
			  }),
		...(credentials ? { credentials } : undefined),
		signal: options?.signal,
	};

	return { url, info };
}

function makeUrl(params: {
	authMethod: "none" | "hf-token" | "credentials-include" | "provider-key";
	chatCompletion: boolean;
	model: string;
	provider: InferenceProvider;
	taskHint: InferenceTask | undefined;
}): string {
	if (params.authMethod === "none" && params.provider !== "hf-inference") {
		throw new Error("Authentication is required when requesting a third-party provider. Please provide accessToken");
	}

	const shouldProxy = params.provider !== "hf-inference" && params.authMethod !== "provider-key";
	switch (params.provider) {
		case "black-forest-labs": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: BLACKFORESTLABS_AI_API_BASE_URL;
			return `${baseUrl}/${params.model}`;
		}
		case "fal-ai": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: FAL_AI_API_BASE_URL;
			return `${baseUrl}/${params.model}`;
		}
		case "nebius": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: NEBIUS_API_BASE_URL;

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

		case "fireworks-ai": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: FIREWORKS_AI_API_BASE_URL;
			if (params.taskHint === "text-generation" && params.chatCompletion) {
				return `${baseUrl}/v1/chat/completions`;
			}
			return baseUrl;
		}
		case "hyperbolic": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: HYPERBOLIC_API_BASE_URL;

			if (params.taskHint === "text-to-image") {
				return `${baseUrl}/v1/images/generations`;
			}
			return `${baseUrl}/v1/chat/completions`;
		}
		case "novita": {
			const baseUrl = shouldProxy
				? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", params.provider)
				: NOVITA_API_BASE_URL;
			if (params.taskHint === "text-generation") {
				if (params.chatCompletion) {
					return `${baseUrl}/chat/completions`;
				}
				return `${baseUrl}/completions`;
			}
			return baseUrl;
		}
		default: {
			const baseUrl = HF_HUB_INFERENCE_PROXY_TEMPLATE.replaceAll("{{PROVIDER}}", "hf-inference");
			if (params.taskHint && ["feature-extraction", "sentence-similarity"].includes(params.taskHint)) {
				/// when deployed on hf-inference, those two tasks are automatically compatible with one another.
				return `${baseUrl}/pipeline/${params.taskHint}/${params.model}`;
			}
			if (params.taskHint === "text-generation" && params.chatCompletion) {
				return `${baseUrl}/models/${params.model}/v1/chat/completions`;
			}
			return `${baseUrl}/models/${params.model}`;
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
