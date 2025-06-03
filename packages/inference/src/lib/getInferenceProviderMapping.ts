import type { WidgetType } from "@huggingface/tasks";
import { HF_HUB_URL } from "../config.js";
import { HARDCODED_MODEL_INFERENCE_MAPPING } from "../providers/consts.js";
import { EQUIVALENT_SENTENCE_TRANSFORMERS_TASKS } from "../providers/hf-inference.js";
import type { InferenceProvider, InferenceProviderOrPolicy, ModelId } from "../types.js";
import { typedInclude } from "../utils/typedInclude.js";
import { InferenceClientHubApiError, InferenceClientInputError } from "../errors.js";

export const inferenceProviderMappingCache = new Map<ModelId, InferenceProviderMapping>();

export type InferenceProviderMapping = Partial<
	Record<InferenceProvider, Omit<InferenceProviderModelMapping, "hfModelId">>
>;

export interface InferenceProviderModelMapping {
	adapter?: string;
	adapterWeightsPath?: string;
	hfModelId: ModelId;
	providerId: string;
	status: "live" | "staging";
	task: WidgetType;
}

export async function fetchInferenceProviderMappingForModel(
	modelId: ModelId,
	accessToken?: string,
	options?: {
		fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
	}
): Promise<InferenceProviderMapping> {
	let inferenceProviderMapping: InferenceProviderMapping | null;
	if (inferenceProviderMappingCache.has(modelId)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		inferenceProviderMapping = inferenceProviderMappingCache.get(modelId)!;
	} else {
		const url = `${HF_HUB_URL}/api/models/${modelId}?expand[]=inferenceProviderMapping`;
		const resp = await (options?.fetch ?? fetch)(url, {
			headers: accessToken?.startsWith("hf_") ? { Authorization: `Bearer ${accessToken}` } : {},
		});
		if (!resp.ok) {
			if (resp.headers.get("Content-Type")?.startsWith("application/json")) {
				const error = await resp.json();
				if ("error" in error && typeof error.error === "string") {
					throw new InferenceClientHubApiError(
						`Failed to fetch inference provider mapping for model ${modelId}: ${error.error}`,
						{ url, method: "GET" },
						{ requestId: resp.headers.get("x-request-id") ?? "", status: resp.status, body: error }
					);
				}
			} else {
				throw new InferenceClientHubApiError(
					`Failed to fetch inference provider mapping for model ${modelId}`,
					{ url, method: "GET" },
					{ requestId: resp.headers.get("x-request-id") ?? "", status: resp.status, body: await resp.text() }
				);
			}
		}
		let payload: { inferenceProviderMapping?: InferenceProviderMapping } | null = null;
		try {
			payload = await resp.json();
		} catch {
			throw new InferenceClientHubApiError(
				`Failed to fetch inference provider mapping for model ${modelId}: malformed API response, invalid JSON`,
				{ url, method: "GET" },
				{ requestId: resp.headers.get("x-request-id") ?? "", status: resp.status, body: await resp.text() }
			);
		}
		if (!payload?.inferenceProviderMapping) {
			throw new InferenceClientHubApiError(
				`We have not been able to find inference provider information for model ${modelId}.`,
				{ url, method: "GET" },
				{ requestId: resp.headers.get("x-request-id") ?? "", status: resp.status, body: await resp.text() }
			);
		}
		inferenceProviderMapping = payload.inferenceProviderMapping;
	}
	return inferenceProviderMapping;
}

export async function getInferenceProviderMapping(
	params: {
		accessToken?: string;
		modelId: ModelId;
		provider: InferenceProvider;
		task: WidgetType;
	},
	options: {
		fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
	}
): Promise<InferenceProviderModelMapping | null> {
	if (HARDCODED_MODEL_INFERENCE_MAPPING[params.provider][params.modelId]) {
		return HARDCODED_MODEL_INFERENCE_MAPPING[params.provider][params.modelId];
	}
	const inferenceProviderMapping = await fetchInferenceProviderMappingForModel(
		params.modelId,
		params.accessToken,
		options
	);
	const providerMapping = inferenceProviderMapping[params.provider];
	if (providerMapping) {
		const equivalentTasks =
			params.provider === "hf-inference" && typedInclude(EQUIVALENT_SENTENCE_TRANSFORMERS_TASKS, params.task)
				? EQUIVALENT_SENTENCE_TRANSFORMERS_TASKS
				: [params.task];
		if (!typedInclude(equivalentTasks, providerMapping.task)) {
			throw new InferenceClientInputError(
				`Model ${params.modelId} is not supported for task ${params.task} and provider ${params.provider}. Supported task: ${providerMapping.task}.`
			);
		}
		if (providerMapping.status === "staging") {
			console.warn(
				`Model ${params.modelId} is in staging mode for provider ${params.provider}. Meant for test purposes only.`
			);
		}
		return { ...providerMapping, hfModelId: params.modelId };
	}
	return null;
}

export async function resolveProvider(
	provider?: InferenceProviderOrPolicy,
	modelId?: string,
	endpointUrl?: string
): Promise<InferenceProvider> {
	if (endpointUrl) {
		if (provider) {
			throw new InferenceClientInputError("Specifying both endpointUrl and provider is not supported.");
		}
		/// Defaulting to hf-inference helpers / API
		return "hf-inference";
	}
	if (!provider) {
		console.log(
			"Defaulting to 'auto' which will select the first provider available for the model, sorted by the user's order in https://hf.co/settings/inference-providers."
		);
		provider = "auto";
	}
	if (provider === "auto") {
		if (!modelId) {
			throw new InferenceClientInputError("Specifying a model is required when provider is 'auto'");
		}
		const inferenceProviderMapping = await fetchInferenceProviderMappingForModel(modelId);
		provider = Object.keys(inferenceProviderMapping)[0] as InferenceProvider | undefined;
	}
	if (!provider) {
		throw new InferenceClientInputError(`No Inference Provider available for model ${modelId}.`);
	}
	return provider;
}
