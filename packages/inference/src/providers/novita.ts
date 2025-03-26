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
import { BaseConversationalTask, BaseTextGenerationTask, TaskProviderHelper } from "./providerHelper";

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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override makeRoute(params: UrlParams): string {
		return "/v3/openai/chat/completions";
	}
}

export class NovitaConversationalTask extends BaseConversationalTask {
	constructor() {
		super("novita", NOVITA_API_BASE_URL);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override makeRoute(params: UrlParams): string {
		return "/v3/openai/chat/completions";
	}
}
export class NovitaTextToVideoTask extends TaskProviderHelper {
	constructor() {
		super("novita", NOVITA_API_BASE_URL, "text-to-video");
	}

	override makeRoute(params: UrlParams): string {
		return `/v3/hf/${params.model}`;
	}

	override makeBody(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
		};
	}
	override async getResponse(res: NovitaOutput): Promise<Blob> {
		const isValidOutput =
			typeof res === "object" &&
			!!res &&
			"video" in res &&
			typeof res.video === "object" &&
			!!res.video &&
			"video_url" in res.video &&
			typeof res.video.video_url === "string" &&
			isUrl(res.video.video_url);

		if (!isValidOutput) {
			throw new InferenceOutputError("Expected { video: { video_url: string } }");
		}

		const urlResponse = await fetch(res.video.video_url);
		return await urlResponse.blob();
	}
}
