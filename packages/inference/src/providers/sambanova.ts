/**
 * See the registered mapping of HF model ID => Sambanova model ID here:
 *
 * https://huggingface.co/api/partners/sambanova/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Sambanova and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Sambanova, please open an issue on the present repo
 * and we will tag Sambanova team members.
 *
 * Thanks!
 */
import { InferenceOutputError } from "../lib/InferenceOutputError";

import type { FeatureExtractionOutput } from "@huggingface/tasks";
import type { BodyParams } from "../types";
import type { FeatureExtractionTaskHelper } from "./providerHelper";
import { BaseConversationalTask, TaskProviderHelper } from "./providerHelper";

export class SambanovaConversationalTask extends BaseConversationalTask {
	constructor() {
		super("sambanova", "https://api.sambanova.ai");
	}
}

export class SambanovaFeatureExtractionTask extends TaskProviderHelper implements FeatureExtractionTaskHelper {
	constructor() {
		super("sambanova", "https://api.sambanova.ai");
	}

	override makeRoute(): string {
		return `/v1/embeddings`;
	}

	override async getResponse(response: FeatureExtractionOutput): Promise<FeatureExtractionOutput> {
		if (typeof response === "object" && "data" in response && Array.isArray(response.data)) {
			return response.data.map((item) => item.embedding);
		}
		throw new InferenceOutputError(
			"Expected Sambanova feature-extraction (embeddings) response format to be {'data' : list of {'embedding' : number[]}}"
		);
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			model: params.model,
			input: params.args.inputs,
			...params.args,
		};
	}
}
