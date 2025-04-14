/**
 * See the registered mapping of HF model ID => Nebius model ID here:
 *
 * https://huggingface.co/api/partners/nebius/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Nebius and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Nebius, please open an issue on the present repo
 * and we will tag Nebius team members.
 *
 * Thanks!
 */
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams, UrlParams } from "../types";
import { omit } from "../utils/omit";
import {
	BaseConversationalTask,
	BaseTextGenerationTask,
	TaskProviderHelper,
	type TextToImageTaskHelper,
} from "./providerHelper";

const NEBIUS_API_BASE_URL = "https://api.studio.nebius.ai";

interface NebiusBase64ImageGeneration {
	data: Array<{
		b64_json: string;
	}>;
}

export class NebiusConversationalTask extends BaseConversationalTask {
	constructor() {
		super("nebius", NEBIUS_API_BASE_URL);
	}
}

export class NebiusTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("nebius", NEBIUS_API_BASE_URL);
	}
}

export class NebiusTextToImageTask extends TaskProviderHelper implements TextToImageTaskHelper {
	constructor() {
		super("nebius", NEBIUS_API_BASE_URL);
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			response_format: "b64_json",
			prompt: params.args.inputs,
			model: params.model,
		};
	}

	makeRoute(params: UrlParams): string {
		void params;
		return "v1/images/generations";
	}

	async getResponse(
		response: NebiusBase64ImageGeneration,
		url?: string,
		headers?: HeadersInit,
		outputType?: "url" | "blob"
	): Promise<string | Blob> {
		if (
			typeof response === "object" &&
			"data" in response &&
			Array.isArray(response.data) &&
			response.data.length > 0 &&
			"b64_json" in response.data[0] &&
			typeof response.data[0].b64_json === "string"
		) {
			const base64Data = response.data[0].b64_json;
			if (outputType === "url") {
				return `data:image/jpeg;base64,${base64Data}`;
			}
			return fetch(`data:image/jpeg;base64,${base64Data}`).then((res) => res.blob());
		}

		throw new InferenceOutputError("Expected Nebius text-to-image response format");
	}
}
