import type { InferenceProvider, InferenceTask, Options } from "../types";
import { HARDCODED_MODEL_ID_MAPPING } from "../providers/consts";
import type { MappingInfo } from "./getModelMapping";

export async function getProviderModelId(
	params: {
		mapping: MappingInfo;
		model: string;
		provider: InferenceProvider;
	},
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

	// A dict called HARDCODED_MODEL_ID_MAPPING takes precedence in all cases (useful for dev purposes)
	if (HARDCODED_MODEL_ID_MAPPING[params.provider]?.[params.model]) {
		return HARDCODED_MODEL_ID_MAPPING[params.provider][params.model];
	}

	return params.mapping.providerId;
}