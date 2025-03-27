/**
 * HF-Inference do not have a mapping since all models use IDs from the Hub.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at HF and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to HF, please open an issue on the present repo
 * and we will tag HF team members.
 *
 * Thanks!
 */
import { HF_ROUTER_URL } from "../config";
import type { BodyParams, InferenceTask, UrlParams } from "../types";
import { TaskProviderHelper } from "./providerHelper";

export class HFInferenceTask extends TaskProviderHelper {
	constructor(task: InferenceTask) {
		super("hf-inference", `${HF_ROUTER_URL}/hf-inference`, task);
	}

	override makeBody(params: BodyParams): Record<string, unknown> {
		return params.args;
	}

	override makeRoute(params: UrlParams): string {
		if (params.task && ["feature-extraction", "sentence-similarity"].includes(params.task)) {
			// when deployed on hf-inference, those two tasks are automatically compatible with one another.
			return `pipeline/${params.task}/${params.model}`;
		}
		return `models/${params.model}`;
	}

	override getResponse(response: unknown): unknown {
		return response;
	}
}

export class HFInferenceBinaryInputTask extends HFInferenceTask {
	constructor(task: InferenceTask) {
		super(task);
	}
}

export class HFInferenceConversationalTask extends HFInferenceTask {
	constructor() {
		super("conversational");
	}

	override makeRoute(params: UrlParams): string {
		return `models/${params.model}/v1/chat/completions`;
	}

	override makeBody(params: BodyParams): Record<string, unknown> {
		return {
			...params.args,
			model: params.model,
		};
	}
}
