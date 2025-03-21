import { HF_HUB_URL, HF_ROUTER_URL } from "../config";
import { BLACK_FOREST_LABS_CONFIG } from "../providers/black-forest-labs";
import { CEREBRAS_CONFIG } from "../providers/cerebras";
import { COHERE_CONFIG } from "../providers/cohere";
import { FAL_AI_CONFIG } from "../providers/fal-ai";
import { FIREWORKS_AI_CONFIG } from "../providers/fireworks-ai";
import { HF_INFERENCE_CONFIG } from "../providers/hf-inference";
import { HYPERBOLIC_CONFIG } from "../providers/hyperbolic";
import { NEBIUS_CONFIG } from "../providers/nebius";
import { NOVITA_CONFIG } from "../providers/novita";
import { REPLICATE_CONFIG } from "../providers/replicate";
import { SAMBANOVA_CONFIG } from "../providers/sambanova";
import { TOGETHER_CONFIG } from "../providers/together";
import { OPENAI_CONFIG } from "../providers/openai";
import type { InferenceProvider, InferenceTask, Options, ProviderConfig, RequestArgs } from "../types";
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
 * Config to define how to serialize requests for each provider
 */
const providerConfigs: Record<InferenceProvider, ProviderConfig> = {
	"black-forest-labs": BLACK_FOREST_LABS_CONFIG,
	cerebras: CEREBRAS_CONFIG,
	cohere: COHERE_CONFIG,
	"fal-ai": FAL_AI_CONFIG,
	"fireworks-ai": FIREWORKS_AI_CONFIG,
	"hf-inference": HF_INFERENCE_CONFIG,
	hyperbolic: HYPERBOLIC_CONFIG,
	openai: OPENAI_CONFIG,
	nebius: NEBIUS_CONFIG,
	novita: NOVITA_CONFIG,
	replicate: REPLICATE_CONFIG,
	sambanova: SAMBANOVA_CONFIG,
	together: TOGETHER_CONFIG,
};

/**
 * Helper that prepares request arguments.
 * This async version handle the model ID resolution step.
 */
export async function makeRequestOptions(
	args: RequestArgs & {
		data?: Blob | ArrayBuffer;
		stream?: boolean;
	},
	options?: Options & {
		/** In most cases (unless we pass a endpointUrl) we know the task */
		task?: InferenceTask;
		chatCompletion?: boolean;
	}
): Promise<{ url: string; info: RequestInit }> {
	const { provider: maybeProvider, model: maybeModel } = args;
	const provider = maybeProvider ?? "hf-inference";
	const providerConfig = providerConfigs[provider];
	const { task, chatCompletion } = options ?? {};

	// Validate inputs
	if (args.endpointUrl && provider !== "hf-inference") {
		throw new Error(`Cannot use endpointUrl with a third-party provider.`);
	}
	if (maybeModel && isUrl(maybeModel)) {
		throw new Error(`Model URLs are no longer supported. Use endpointUrl instead.`);
	}
	if (!maybeModel && !task) {
		throw new Error("No model provided, and no task has been specified.");
	}
	if (!providerConfig) {
		throw new Error(`No provider config found for provider ${provider}`);
	}
	if (providerConfig.clientSideRoutingOnly && !maybeModel) {
		throw new Error(`Provider ${provider} requires a model ID to be passed directly.`);
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const hfModel = maybeModel ?? (await loadDefaultModel(task!));
	const resolvedModel = providerConfig.clientSideRoutingOnly
		? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		  removeProviderPrefix(maybeModel!, provider)
		: await getProviderModelId({ model: hfModel, provider }, args, {
				task,
				chatCompletion,
				fetch: options?.fetch,
		  });

	// Use the sync version with the resolved model
	return makeRequestOptionsFromResolvedModel(resolvedModel, args, options);
}

/**
 * Helper that prepares request arguments. - for internal use only
 * This sync version skips the model ID resolution step
 */
export function makeRequestOptionsFromResolvedModel(
	resolvedModel: string,
	args: RequestArgs & {
		data?: Blob | ArrayBuffer;
		stream?: boolean;
	},
	options?: Options & {
		task?: InferenceTask;
		chatCompletion?: boolean;
	}
): { url: string; info: RequestInit } {
	const { accessToken, endpointUrl, provider: maybeProvider, model, ...remainingArgs } = args;
	void model;

	const provider = maybeProvider ?? "hf-inference";
	const providerConfig = providerConfigs[provider];

	const { includeCredentials, task, chatCompletion, signal } = options ?? {};

	const authMethod = (() => {
		if (providerConfig.clientSideRoutingOnly) {
			// Closed-source providers require an accessToken (cannot be routed).
			if (accessToken && accessToken.startsWith("hf_")) {
				throw new Error(`Provider ${provider} is closed-source and does not support HF tokens.`);
			}
			return "provider-key";
		}
		if (accessToken) {
			return accessToken.startsWith("hf_") ? "hf-token" : "provider-key";
		}
		if (includeCredentials === "include") {
			// If accessToken is passed, it should take precedence over includeCredentials
			return "credentials-include";
		}
		return "none";
	})();

	// Make URL
	const url = endpointUrl
		? chatCompletion
			? endpointUrl + `/v1/chat/completions`
			: endpointUrl
		: providerConfig.makeUrl({
				authMethod,
				baseUrl:
					authMethod !== "provider-key"
						? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", provider)
						: providerConfig.makeBaseUrl(task),
				model: resolvedModel,
				chatCompletion,
				task,
		  });

	// Make headers
	const binary = "data" in args && !!args.data;
	const headers = providerConfig.makeHeaders({
		accessToken,
		authMethod,
	});

	// Add content-type to headers
	if (!binary) {
		headers["Content-Type"] = "application/json";
	}

	// Add user-agent to headers
	// e.g. @huggingface/inference/3.1.3
	const ownUserAgent = `${packageName}/${packageVersion}`;
	const userAgent = [ownUserAgent, typeof navigator !== "undefined" ? navigator.userAgent : undefined]
		.filter((x) => x !== undefined)
		.join(" ");
	headers["User-Agent"] = userAgent;

	// Make body
	const body = binary
		? args.data
		: JSON.stringify(
				providerConfig.makeBody({
					args: remainingArgs as Record<string, unknown>,
					model: resolvedModel,
					task,
					chatCompletion,
				})
		  );

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
		body,
		...(credentials ? { credentials } : undefined),
		signal,
	};

	return { url, info };
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

function removeProviderPrefix(model: string, provider: string): string {
	if (!model.startsWith(`${provider}/`)) {
		throw new Error(`Models from ${provider} must be prefixed by "${provider}/". Got "${model}".`);
	}
	return model.slice(provider.length + 1);
}
