import { name as packageName, version as packageVersion } from "../../package.json";
import { HF_HEADER_X_BILL_TO, HF_HUB_URL } from "../config";
import type { InferenceTask, Options, RequestArgs } from "../types";
import type { InferenceProviderModelMapping } from "./getInferenceProviderMapping";
import { getInferenceProviderMapping } from "./getInferenceProviderMapping";
import type { getProviderHelper } from "./getProviderHelper";
import { isUrl } from "./isUrl";

/**
 * Lazy-loaded from huggingface.co/api/tasks when needed
 * Used to determine the default model to use when it's not user defined
 */
let tasks: Record<string, { models: { id: string }[] }> | null = null;

/**
 * Helper that prepares request arguments.
 * This async version handle the model ID resolution step.
 */
export async function makeRequestOptions(
	args: RequestArgs & {
		data?: Blob | ArrayBuffer;
		stream?: boolean;
	},
	providerHelper: ReturnType<typeof getProviderHelper>,
	options?: Options & {
		/** In most cases (unless we pass a endpointUrl) we know the task */
		task?: InferenceTask;
	}
): Promise<{ url: string; info: RequestInit }> {
	const { model: maybeModel } = args;
	const provider = providerHelper.provider;
	const { task } = options ?? {};

	// Validate inputs
	if (args.endpointUrl && provider !== "hf-inference") {
		throw new Error(`Cannot use endpointUrl with a third-party provider.`);
	}
	if (maybeModel && isUrl(maybeModel)) {
		throw new Error(`Model URLs are no longer supported. Use endpointUrl instead.`);
	}

	if (args.endpointUrl) {
		// No need to have maybeModel, or to load default model for a task
		return makeRequestOptionsFromResolvedModel(
			maybeModel ?? args.endpointUrl,
			providerHelper,
			args,
			undefined,
			options
		);
	}

	if (!maybeModel && !task) {
		throw new Error("No model provided, and no task has been specified.");
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const hfModel = maybeModel ?? (await loadDefaultModel(task!));

	if (providerHelper.clientSideRoutingOnly && !maybeModel) {
		throw new Error(`Provider ${provider} requires a model ID to be passed directly.`);
	}

	const inferenceProviderMapping = providerHelper.clientSideRoutingOnly
		? ({
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				providerId: removeProviderPrefix(maybeModel!, provider),
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				hfModelId: maybeModel!,
				status: "live",
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				task: task!,
		  } satisfies InferenceProviderModelMapping)
		: await getInferenceProviderMapping(
				{
					modelId: hfModel,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					task: task!,
					provider,
					accessToken: args.accessToken,
				},
				{ fetch: options?.fetch }
		  );
	if (!inferenceProviderMapping) {
		throw new Error(`We have not been able to find inference provider information for model ${hfModel}.`);
	}

	// Use the sync version with the resolved model
	return makeRequestOptionsFromResolvedModel(
		inferenceProviderMapping.providerId,
		providerHelper,
		args,
		inferenceProviderMapping,
		options
	);
}

/**
 * Helper that prepares request arguments. - for internal use only
 * This sync version skips the model ID resolution step
 */
export function makeRequestOptionsFromResolvedModel(
	resolvedModel: string,
	providerHelper: ReturnType<typeof getProviderHelper>,
	args: RequestArgs & {
		data?: Blob | ArrayBuffer;
		stream?: boolean;
	},
	mapping: InferenceProviderModelMapping | undefined,
	options?: Options & {
		task?: InferenceTask;
	}
): { url: string; info: RequestInit } {
	const { accessToken, endpointUrl, provider: maybeProvider, model, ...remainingArgs } = args;
	void model;
	void maybeProvider;

	const provider = providerHelper.provider;

	const { includeCredentials, task, signal, billTo } = options ?? {};
	const authMethod = (() => {
		if (providerHelper.clientSideRoutingOnly) {
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

	const modelId = endpointUrl ?? resolvedModel;
	const url = providerHelper.makeUrl({
		authMethod,
		model: modelId,
		task,
	});
	// Make headers
	const headers = providerHelper.prepareHeaders(
		{
			accessToken,
			authMethod,
		},
		"data" in args && !!args.data
	);
	if (billTo) {
		headers[HF_HEADER_X_BILL_TO] = billTo;
	}

	// Add user-agent to headers
	// e.g. @huggingface/inference/3.1.3
	const ownUserAgent = `${packageName}/${packageVersion}`;
	const userAgent = [ownUserAgent, typeof navigator !== "undefined" ? navigator.userAgent : undefined]
		.filter((x) => x !== undefined)
		.join(" ");
	headers["User-Agent"] = userAgent;

	// Make body
	const body = providerHelper.makeBody({
		args: remainingArgs as Record<string, unknown>,
		model: resolvedModel,
		task,
		mapping,
	});
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
		body: body,
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
