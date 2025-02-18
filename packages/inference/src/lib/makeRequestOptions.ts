import { HF_HUB_URL, HF_ROUTER_URL } from "../config";
import { blackForestLabsConfig } from "../providers/black-forest-labs";
import { falAiConfig } from "../providers/fal-ai";
import { fireworksAiConfig } from "../providers/fireworks-ai";
import { hfInferenceConfig } from "../providers/hf-inference";
import { hyperbolicConfig } from "../providers/hyperbolic";
import { nebiusConfig } from "../providers/nebius";
import { novitaConfig } from "../providers/novita";
import { replicateConfig } from "../providers/replicate";
import { sambanovaConfig } from "../providers/sambanova";
import { togetherConfig } from "../providers/together";
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
	"black-forest-labs": blackForestLabsConfig,
	"fal-ai": falAiConfig,
	"fireworks-ai": fireworksAiConfig,
	"hf-inference": hfInferenceConfig,
	hyperbolic: hyperbolicConfig,
	nebius: nebiusConfig,
	novita: novitaConfig,
	replicate: replicateConfig,
	sambanova: sambanovaConfig,
	together: togetherConfig,
};

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
	const provider = maybeProvider ?? "hf-inference";
	const providerConfig = providerConfigs[provider];

	const { includeCredentials, taskHint, chatCompletion, signal } = options ?? {};

	if (endpointUrl && provider !== "hf-inference") {
		throw new Error(`Cannot use endpointUrl with a third-party provider.`);
	}
	if (maybeModel && isUrl(maybeModel)) {
		throw new Error(`Model URLs are no longer supported. Use endpointUrl instead.`);
	}
	if (!maybeModel && !taskHint) {
		throw new Error("No model provided, and no task has been specified.");
	}
	if (!providerConfig) {
		throw new Error(`No provider config found for provider ${provider}`);
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

	// Make URL
	const url = endpointUrl
		? chatCompletion
			? endpointUrl + `/v1/chat/completions`
			: endpointUrl
		: providerConfig.makeUrl({
				baseUrl:
					authMethod !== "provider-key"
						? HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", provider)
						: providerConfig.baseUrl,
				model,
				taskHint,
				chatCompletion,
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
					model,
					taskHint,
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
