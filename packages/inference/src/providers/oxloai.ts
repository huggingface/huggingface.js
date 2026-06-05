/**
 * See the registered mapping of HF model ID => OxloAI model ID here:
 *
 * https://huggingface.co/api/partners/oxloai/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at OxloAI and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to OxloAI, please open an issue on the present repo
 * and we will tag OxloAI team members.
 *
 * Thanks!
 */
import type { TextToImageInput } from "@huggingface/tasks";
import type { BaseArgs, BodyParams, OutputType } from "../types.js";
import { omit } from "../utils/omit.js";
import {
	BaseConversationalTask,
	TaskProviderHelper,
	type TextToImageTaskHelper,
} from "./providerHelper.js";
import { InferenceClientProviderOutputError } from "../errors.js";

const OXLOAI_API_BASE_URL = "https://api.oxlo.ai";

export class OxloAIConversationalTask extends BaseConversationalTask {
	constructor() {
		super("oxloai", OXLOAI_API_BASE_URL);
	}
}

interface OxloAIImageGeneration {
	data: Array<{
		b64_json?: string;
		url?: string;
	}>;
}

export class OxloAITextToImageTask extends TaskProviderHelper implements TextToImageTaskHelper {
	constructor() {
		super("oxloai", OXLOAI_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/images/generations";
	}

	preparePayload(params: BodyParams<TextToImageInput & BaseArgs>): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
			response_format: params.outputType === "url" ? "url" : "b64_json",
			model: params.model,
		};
	}

	async getResponse(
		response: OxloAIImageGeneration,
		url?: string,
		headers?: HeadersInit,
		outputType?: OutputType,
	): Promise<string | Blob | Record<string, unknown>> {
		if (
			typeof response === "object" &&
			"data" in response &&
			Array.isArray(response.data) &&
			response.data.length > 0
		) {
			if (outputType === "json") {
				return { ...response };
			}

			if ("url" in response.data[0] && typeof response.data[0].url === "string") {
				return response.data[0].url;
			}

			if ("b64_json" in response.data[0] && typeof response.data[0].b64_json === "string") {
				const base64Data = response.data[0].b64_json;
				if (outputType === "dataUrl") {
					return `data:image/png;base64,${base64Data}`;
				}
				return fetch(`data:image/png;base64,${base64Data}`).then((res) => res.blob());
			}
		}

		throw new InferenceClientProviderOutputError("Received malformed response from OxloAI text-to-image API");
	}
}
