/**
 * See the registered mapping of HF model ID => TheComputeFactory model ID here:
 *
 * https://huggingface.co/api/partners/thecomputefactory/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at TheComputeFactory and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to TheComputeFactory, please open an issue on the present repo
 * and we will tag TheComputeFactory team members.
 *
 * Thanks!
 */
import type { TextToVideoArgs } from "../tasks/index.js";
import type { BodyParams, UrlParams } from "../types.js";
import { omit } from "../utils/omit.js";
import { InferenceClientProviderOutputError } from "../errors.js";
import { BaseConversationalTask, TaskProviderHelper, type TextToVideoTaskHelper } from "./providerHelper.js";

const TCF_API_BASE_URL = "https://api.thecomputefactory.com";

export class TCFConversationalTask extends BaseConversationalTask {
	constructor() {
		super("thecomputefactory", TCF_API_BASE_URL);
	}
}

export class TCFTextToVideoTask extends TaskProviderHelper implements TextToVideoTaskHelper {
	constructor() {
		super("thecomputefactory", TCF_API_BASE_URL);
	}

	makeRoute(_params: UrlParams): string {
		return "v1/text-to-video";
	}

	preparePayload(params: BodyParams<TextToVideoArgs>): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...params.args.parameters,
			prompt: params.args.inputs,
			model: params.model,
		};
	}

	async getResponse(response: unknown): Promise<Blob> {
		if (response instanceof Blob) {
			return response;
		}
		throw new InferenceClientProviderOutputError(
			"Expected binary response from TheComputeFactory text-to-video API",
		);
	}
}
