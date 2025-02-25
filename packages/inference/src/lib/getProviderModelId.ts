import type { WidgetType } from "@huggingface/tasks";
import type { InferenceProvider, InferenceTask, ModelId, Options, RequestArgs } from "../types";
import { HF_HUB_URL } from "../config";
import { HARDCODED_MODEL_ID_MAPPING } from "../providers/consts";

type InferenceProviderMapping = Partial<
	Record<InferenceProvider, { providerId: string; status: "live" | "staging"; task: WidgetType }>
>;
const inferenceProviderMappingCache = new Map<ModelId, InferenceProviderMapping>();

export async function getProviderModelId(
	params: {
		model: string;
		provider: InferenceProvider;
	},
	args: RequestArgs,
	options: {
		task?: InferenceTask;
		chatCompletion?: boolean;
		fetch?: Options["fetch"];
	} = {}
): Promise<string> {
	if (params.provider === "hf-inference") {
		return params.model;
	}
	if (!options.task) {
		throw new Error("task must be specified when using a third-party provider");
	}
	const task: WidgetType =
		options.task === "text-generation" && options.chatCompletion ? "conversational" : options.task;

	// A dict called HARDCODED_MODEL_ID_MAPPING takes precedence in all cases (useful for dev purposes)
	if (HARDCODED_MODEL_ID_MAPPING[params.provider]?.[params.model]) {
		return HARDCODED_MODEL_ID_MAPPING[params.provider][params.model];
	}

	let inferenceProviderMapping: InferenceProviderMapping | null;
	if (inferenceProviderMappingCache.has(params.model)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		inferenceProviderMapping = inferenceProviderMappingCache.get(params.model)!;
	} else {
		inferenceProviderMapping = await (options?.fetch ?? fetch)(
			`${HF_HUB_URL}/api/models/${params.model}?expand[]=inferenceProviderMapping`,
			{
				headers: args.accessToken?.startsWith("hf_") ? { Authorization: `Bearer ${args.accessToken}` } : {},
			}
		)
			.then((resp) => resp.json())
			.then((json) => json.inferenceProviderMapping)
			.catch(() => null);
	}

	if (!inferenceProviderMapping) {
		throw new Error(`We have not been able to find inference provider information for model ${params.model}.`);
	}

	const providerMapping = inferenceProviderMapping[params.provider];
	if (providerMapping) {
		if (providerMapping.task !== task) {
			throw new Error(
				`Model ${params.model} is not supported for task ${task} and provider ${params.provider}. Supported task: ${providerMapping.task}.`
			);
		}
		if (providerMapping.status === "staging") {
			console.warn(
				`Model ${params.model} is in staging mode for provider ${params.provider}. Meant for test purposes only.`
			);
		}
		// TODO: how is it handled server-side if model has multiple tasks (e.g. `text-generation` + `conversational`)?
		return providerMapping.providerId;
	}

	throw new Error(`Model ${params.model} is not supported provider ${params.provider}.`);
}
