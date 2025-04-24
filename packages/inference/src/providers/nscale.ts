/**
 * See the registered mapping of HF model ID => Nscale model ID here:
 *
 * https://huggingface.co/api/partners/nscale-cloud/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Nscale and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Nscale, please open an issue on the present repo
 * and we will tag Nscale team members.
 *
 * Thanks!
 */
import type { TextToImageInput } from "@huggingface/tasks";
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams } from "../types";
import { omit } from "../utils/omit";
import { BaseConversationalTask, TaskProviderHelper, type TextToImageTaskHelper } from "./providerHelper";

const NSCALE_API_BASE_URL = "https://inference.api.nscale.com";

interface NscaleCloudBase64ImageGeneration {
	data: Array<{
		b64_json: string;
	}>;
}

export class NscaleConversationalTask extends BaseConversationalTask {
	constructor() {
		super("nscale", NSCALE_API_BASE_URL);
	}
}

export class NscaleTextToImageTask extends TaskProviderHelper implements TextToImageTaskHelper {
	constructor() {
		super("nscale", NSCALE_API_BASE_URL);
	}

	preparePayload(params: BodyParams<TextToImageInput>): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...params.args.parameters,
			response_format: "b64_json",
			prompt: params.args.inputs,
			model: params.model,
		};
	}

	makeRoute(): string {
		return "v1/images/generations";
	}

	async getResponse(
		response: NscaleCloudBase64ImageGeneration,
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

		throw new InferenceOutputError("Expected Nscale text-to-image response format");
	}
}
