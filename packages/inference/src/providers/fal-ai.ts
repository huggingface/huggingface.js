/**
 * See the registered mapping of HF model ID => Fal model ID here:
 *
 * https://huggingface.co/api/partners/fal-ai/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Fal and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Fal, please open an issue on the present repo
 * and we will tag Fal team members.
 *
 * Thanks!
 */
import type { AutomaticSpeechRecognitionOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../lib/InferenceOutputError";
import { isUrl } from "../lib/isUrl";
import type { BodyParams, HeaderParams, ModelId, UrlParams } from "../types";
import { delay } from "../utils/delay";
import { omit } from "../utils/omit";
import {
	type AutomaticSpeechRecognitionTaskHelper,
	TaskProviderHelper,
	type TextToImageTaskHelper,
	type TextToVideoTaskHelper,
} from "./providerHelper";
import { HF_HUB_URL } from "../config";

export interface FalAiQueueOutput {
	request_id: string;
	status: string;
	response_url: string;
}

interface FalAITextToImageOutput {
	images: Array<{
		url: string;
	}>;
}

interface FalAIAutomaticSpeechRecognitionOutput {
	text: string;
}

interface FalAITextToSpeechOutput {
	audio: {
		url: string;
		content_type: string;
	};
}
export const FAL_AI_SUPPORTED_BLOB_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav"];

abstract class FalAITask extends TaskProviderHelper {
	constructor(url?: string) {
		super("fal-ai", url || "https://fal.run");
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return params.args;
	}
	makeRoute(params: UrlParams): string {
		return `/${params.model}`;
	}
	override prepareHeaders(params: HeaderParams, binary: boolean): Record<string, string> {
		const headers: Record<string, string> = {
			Authorization:
				params.authMethod !== "provider-key" ? `Bearer ${params.accessToken}` : `Key ${params.accessToken}`,
		};
		if (!binary) {
			headers["Content-Type"] = "application/json";
		}
		return headers;
	}
}

function buildLoraPath(modelId: ModelId, adapterWeightsPath: string): string {
	return `${HF_HUB_URL}/${modelId}/resolve/main/${adapterWeightsPath}`;
}

export class FalAITextToImageTask extends FalAITask implements TextToImageTaskHelper {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		const payload: Record<string, unknown> = {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			sync_mode: true,
			prompt: params.args.inputs,
			...(params.mapping?.adapter === "lora" && params.mapping.adapterWeightsPath
				? {
						loras: [
							{
								path: buildLoraPath(params.mapping.hfModelId, params.mapping.adapterWeightsPath),
								scale: 1,
							},
						],
				  }
				: undefined),
		};

		if (params.mapping?.adapter === "lora" && params.mapping.adapterWeightsPath) {
			payload.loras = [
				{
					path: buildLoraPath(params.mapping.hfModelId, params.mapping.adapterWeightsPath),
					scale: 1,
				},
			];
			if (params.mapping.providerId === "fal-ai/lora") {
				payload.model_name = "stabilityai/stable-diffusion-xl-base-1.0";
			}
		}

		return payload;
	}

	override async getResponse(response: FalAITextToImageOutput, outputType?: "url" | "blob"): Promise<string | Blob> {
		if (
			typeof response === "object" &&
			"images" in response &&
			Array.isArray(response.images) &&
			response.images.length > 0 &&
			"url" in response.images[0] &&
			typeof response.images[0].url === "string"
		) {
			if (outputType === "url") {
				return response.images[0].url;
			}
			const urlResponse = await fetch(response.images[0].url);
			return await urlResponse.blob();
		}

		throw new InferenceOutputError("Expected Fal.ai text-to-image response format");
	}
}

export class FalAITextToVideoTask extends FalAITask implements TextToVideoTaskHelper {
	constructor() {
		super("https://queue.fal.run");
	}
	override makeRoute(params: UrlParams): string {
		if (params.authMethod !== "provider-key") {
			return `/${params.model}?_subdomain=queue`;
		}
		return `/${params.model}`;
	}
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
		};
	}

	override async getResponse(
		response: FalAiQueueOutput,
		url?: string,
		headers?: Record<string, string>
	): Promise<Blob> {
		if (!url || !headers) {
			throw new InferenceOutputError("URL and headers are required for text-to-video task");
		}
		const requestId = response.request_id;
		if (!requestId) {
			throw new InferenceOutputError("No request ID found in the response");
		}
		let status = response.status;

		const parsedUrl = new URL(url);
		const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${
			parsedUrl.host === "router.huggingface.co" ? "/fal-ai" : ""
		}`;

		// extracting the provider model id for status and result urls
		// from the response as it might be different from the mapped model in `url`
		const modelId = new URL(response.response_url).pathname;
		const queryParams = parsedUrl.search;

		const statusUrl = `${baseUrl}${modelId}/status${queryParams}`;
		const resultUrl = `${baseUrl}${modelId}${queryParams}`;

		while (status !== "COMPLETED") {
			await delay(500);
			const statusResponse = await fetch(statusUrl, { headers });

			if (!statusResponse.ok) {
				throw new InferenceOutputError("Failed to fetch response status from fal-ai API");
			}
			try {
				status = (await statusResponse.json()).status;
			} catch (error) {
				throw new InferenceOutputError("Failed to parse status response from fal-ai API");
			}
		}

		const resultResponse = await fetch(resultUrl, { headers });
		let result: unknown;
		try {
			result = await resultResponse.json();
		} catch (error) {
			throw new InferenceOutputError("Failed to parse result response from fal-ai API");
		}
		if (
			typeof result === "object" &&
			!!result &&
			"video" in result &&
			typeof result.video === "object" &&
			!!result.video &&
			"url" in result.video &&
			typeof result.video.url === "string" &&
			isUrl(result.video.url)
		) {
			const urlResponse = await fetch(result.video.url);
			return await urlResponse.blob();
		} else {
			throw new InferenceOutputError(
				"Expected { video: { url: string } } result format, got instead: " + JSON.stringify(result)
			);
		}
	}
}

export class FalAIAutomaticSpeechRecognitionTask extends FalAITask implements AutomaticSpeechRecognitionTaskHelper {
	override prepareHeaders(params: HeaderParams, binary: boolean): Record<string, string> {
		const headers = super.prepareHeaders(params, binary);
		headers["Content-Type"] = "application/json";
		return headers;
	}
	override async getResponse(response: unknown): Promise<AutomaticSpeechRecognitionOutput> {
		const res = response as FalAIAutomaticSpeechRecognitionOutput;
		if (typeof res?.text !== "string") {
			throw new InferenceOutputError(
				`Expected { text: string } format from Fal.ai Automatic Speech Recognition, got: ${JSON.stringify(response)}`
			);
		}
		return { text: res.text };
	}
}

export class FalAITextToSpeechTask extends FalAITask {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			lyrics: params.args.inputs,
		};
	}

	override async getResponse(response: unknown): Promise<Blob> {
		const res = response as FalAITextToSpeechOutput;
		if (typeof res?.audio?.url !== "string") {
			throw new InferenceOutputError(
				`Expected { audio: { url: string } } format from Fal.ai Text-to-Speech, got: ${JSON.stringify(response)}`
			);
		}
		try {
			const urlResponse = await fetch(res.audio.url);
			if (!urlResponse.ok) {
				throw new Error(`Failed to fetch audio from ${res.audio.url}: ${urlResponse.statusText}`);
			}
			return await urlResponse.blob();
		} catch (error) {
			throw new InferenceOutputError(
				`Error fetching or processing audio from Fal.ai Text-to-Speech URL: ${res.audio.url}. ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}
}
