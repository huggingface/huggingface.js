import type { WidgetType } from "@huggingface/tasks";
import { HF_HUB_URL } from "../config";
import { HARDCODED_MODEL_ID_MAPPING } from "../providers/consts";
import type { InferenceProvider, InferenceTask, Options, RequestArgs } from "../types";

export async function getProviderModelId(
	params: {
		model: string;
		provider: InferenceProvider;
	},
	args: RequestArgs,
	options: {
		taskHint?: InferenceTask;
		chatCompletion?: boolean;
		fetch?: Options["fetch"];
	} = {}
): Promise<string> {
	if (params.provider === "hf-inference") {
		return params.model;
	}
	if (!options.taskHint) {
		throw new Error("taskHint must be specified when using a third-party provider");
	}
	const task: WidgetType =
		options.taskHint === "text-generation" && options.chatCompletion ? "conversational" : options.taskHint;

	// A dict called HARDCODED_MODEL_ID_MAPPING takes precedence in all cases (useful for dev purposes)
	if (HARDCODED_MODEL_ID_MAPPING[params.model]) {
		return HARDCODED_MODEL_ID_MAPPING[params.model];
	}

	// TODO: cache this call
	const inferenceProviderMapping = await (options?.fetch ?? fetch)(
		`${HF_HUB_URL}/api/models/${params.model}?expand[]=inferenceProviderMapping`,
		{
			headers: args.accessToken?.startsWith("hf_") ? { Authorization: `Bearer ${args.accessToken}` } : {},
		}
	)
		.then((resp) => resp.json())
		.then((json) => json.inferenceProviderMapping)
		.catch(() => null);

	const providerMapping = inferenceProviderMapping[params.provider];
	// If provider listed => takes precedence over hard-coded mapping
	if (providerMapping) {
		if (providerMapping.task !== task) {
			throw new Error(
				`Model ${params.model} is not supported for task ${task} and provider ${params.provider}. Supported task: ${inferenceProviderMapping.task}.`
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

	throw new Error(`Model ${params.model} is not supported for task ${task} and provider ${params.provider}.`);
}
