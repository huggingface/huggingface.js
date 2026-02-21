/**
 * See the registered mapping of HF model ID => Charity Engine model ID here:
 *
 * https://huggingface.co/api/partners/PicadorMultimedia/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Charity Engine and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Charity Engine, please open an issue on the present repo
 * and we will tag Charity Engine team members.
 *
 * Thanks!
 */
import type { FeatureExtractionOutput } from "@huggingface/tasks";
import type { BodyParams } from "../types.js";
import type { FeatureExtractionTaskHelper } from "./providerHelper.js";
import { BaseConversationalTask, BaseTextGenerationTask, TaskProviderHelper } from "./providerHelper.js";
import { InferenceClientProviderOutputError } from "../errors.js";

export class CharityEngineConversationalTask extends BaseConversationalTask {
	constructor() {
		super("charity-engine", "https://api.charityengine.services/remotejobs/v2/inference");
	}

	override makeRoute(): string {
		return "chat/completions";
	}
}

export class CharityEngineTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("charity-engine", "https://api.charityengine.services/remotejobs/v2/inference");
	}

	override makeRoute(): string {
		return "completions";
	}
}

export class CharityEngineFeatureExtractionTask extends TaskProviderHelper implements FeatureExtractionTaskHelper {
	constructor() {
		super("charity-engine", "https://api.charityengine.services/remotejobs/v2/inference");
	}

	override makeRoute(): string {
		return "embeddings";
	}

	override async getResponse(response: FeatureExtractionOutput): Promise<FeatureExtractionOutput> {
		if (typeof response === "object" && "data" in response && Array.isArray(response.data)) {
			return response.data.map((item) => item.embedding);
		}
		throw new InferenceClientProviderOutputError(
			"Received malformed response from Charity Engine feature-extraction (embeddings) API",
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
