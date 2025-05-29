/**
 * See the registered mapping of HF model ID => Together model ID here:
 *
 * https://huggingface.co/api/partners/together/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Together and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Together, please open an issue on the present repo
 * and we will tag Together team members.
 *
 * Thanks!
 */
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams } from "../types";
import { omit } from "../utils/omit";
import {
	BaseConversationalTask,
	TaskProviderHelper,
	type TextToImageTaskHelper,
} from "./providerHelper";

const DAT1_API_BASE_URL = "https://api.dat1.co/api/v1/hf";

interface Dat1Base64ImageGeneration {
	data: Array<{
		b64_json: string;
	}>;
}

export class Dat1ConversationalTask extends BaseConversationalTask {
	constructor() {
		super("dat1", DAT1_API_BASE_URL);
	}

	override makeRoute(): string {
		return "/chat/completions";
	}
}

export class Dat1TextToImageTask extends TaskProviderHelper implements TextToImageTaskHelper {
	constructor() {
		super("dat1", DAT1_API_BASE_URL);
	}

	override makeRoute(): string {
		return "/images/generations";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
			response_format: "base64",
			model: params.model,
		};
	}

	async getResponse(response: Dat1Base64ImageGeneration, outputType?: "url" | "blob"): Promise<string | Blob> {
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

		throw new InferenceOutputError("Expected Dat1 text-to-image response format");
	}
}
