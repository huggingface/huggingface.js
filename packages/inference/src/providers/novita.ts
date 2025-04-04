/**
 * See the registered mapping of HF model ID => Novita model ID here:
 *
 * https://huggingface.co/api/partners/novita/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Novita and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Novita, please open an issue on the present repo
 * and we will tag Novita team members.
 *
 * Thanks!
 */
import { InferenceOutputError } from "../lib/InferenceOutputError";
import { isUrl } from "../lib/isUrl";
import type { BodyParams, UrlParams } from "../types";
import { omit } from "../utils/omit";
import {
	BaseConversationalTask,
	BaseTextGenerationTask,
	TaskProviderHelper,
	type TextToVideoTaskHelper,
} from "./providerHelper";

const NOVITA_API_BASE_URL = "https://api.novita.ai";
export interface NovitaOutput {
	video: {
		video_url: string;
	};
}
export class NovitaTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("novita", NOVITA_API_BASE_URL);
	}

	override makeRoute(): string {
		return "/v3/openai/chat/completions";
	}
}

export class NovitaConversationalTask extends BaseConversationalTask {
	constructor() {
		super("novita", NOVITA_API_BASE_URL);
	}

	override makeRoute(): string {
		return "/v3/openai/chat/completions";
	}
}
export class NovitaTextToVideoTask extends TaskProviderHelper implements TextToVideoTaskHelper {
	constructor() {
		super("novita", NOVITA_API_BASE_URL);
	}

	makeRoute(params: UrlParams): string {
		return `/v3/hf/${params.model}`;
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
		};
	}
	override async getResponse(response: NovitaOutput): Promise<Blob> {
		const isValidOutput =
			typeof response === "object" &&
			!!response &&
			"video" in response &&
			typeof response.video === "object" &&
			!!response.video &&
			"video_url" in response.video &&
			typeof response.video.video_url === "string" &&
			isUrl(response.video.video_url);

		if (!isValidOutput) {
			throw new InferenceOutputError("Expected { video: { video_url: string } }");
		}

		const urlResponse = await fetch(response.video.video_url);
		return await urlResponse.blob();
	}
}
