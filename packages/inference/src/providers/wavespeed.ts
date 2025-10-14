import type { TextToImageArgs } from "../tasks/cv/textToImage.js";
import type { ImageToImageArgs } from "../tasks/cv/imageToImage.js";
import type { TextToVideoArgs } from "../tasks/cv/textToVideo.js";
import type { BodyParams, RequestArgs, UrlParams } from "../types.js";
import { delay } from "../utils/delay.js";
import { omit } from "../utils/omit.js";
import { base64FromBytes } from "../utils/base64FromBytes.js";
import type { TextToImageTaskHelper, TextToVideoTaskHelper, ImageToImageTaskHelper } from "./providerHelper.js";
import { TaskProviderHelper } from "./providerHelper.js";
import {
	InferenceClientInputError,
	InferenceClientProviderApiError,
	InferenceClientProviderOutputError,
} from "../errors.js";

const WAVESPEEDAI_API_BASE_URL = "https://api.wavespeed.ai";

/**
 * Response structure for task status and results
 */
interface WaveSpeedAITaskResponse {
	id: string;
	model: string;
	outputs: string[];
	urls: {
		get: string;
	};
	has_nsfw_contents: boolean[];
	status: "created" | "processing" | "completed" | "failed";
	created_at: string;
	error: string;
	executionTime: number;
	timings: {
		inference: number;
	};
}

/**
 * Response structure for initial task submission
 */
interface WaveSpeedAISubmitResponse {
	id: string;
	urls: {
		get: string;
	};
}

/**
 * Response structure for WaveSpeed AI API
 */
interface WaveSpeedAIResponse {
	code: number;
	message: string;
	data: WaveSpeedAITaskResponse;
}

/**
 * Response structure for WaveSpeed AI API with submit response data
 */
interface WaveSpeedAISubmitTaskResponse {
	code: number;
	message: string;
	data: WaveSpeedAISubmitResponse;
}

abstract class WavespeedAITask extends TaskProviderHelper {
	constructor(url?: string) {
		super("wavespeed", url || WAVESPEEDAI_API_BASE_URL);
	}

	makeRoute(params: UrlParams): string {
		return `/api/v3/${params.model}`;
	}

	preparePayload(params: BodyParams<ImageToImageArgs | TextToImageArgs | TextToVideoArgs>): Record<string, unknown> {
		const payload: Record<string, unknown> = {
			...omit(params.args, ["inputs", "parameters"]),
			...params.args.parameters,
			prompt: params.args.inputs,
		};
		// Add LoRA support if adapter is specified in the mapping
		if (params.mapping?.adapter === "lora") {
			payload.loras = [
				{
					path: params.mapping.hfModelId,
					scale: 1, // Default scale value
				},
			];
		}
		return payload;
	}

	override async getResponse(
		response: WaveSpeedAISubmitTaskResponse,
		url?: string,
		headers?: Record<string, string>
	): Promise<Blob> {
		if (!headers) {
			throw new InferenceClientInputError("Headers are required for WaveSpeed AI API calls");
		}

		const resultUrl = response.data.urls.get;

		// Poll for results until completion
		while (true) {
			const resultResponse = await fetch(resultUrl, { headers });

			if (!resultResponse.ok) {
				throw new InferenceClientProviderApiError(
					"Failed to fetch response status from WaveSpeed AI API",
					{ url: resultUrl, method: "GET" },
					{
						requestId: resultResponse.headers.get("x-request-id") ?? "",
						status: resultResponse.status,
						body: await resultResponse.text(),
					}
				);
			}

			const result: WaveSpeedAIResponse = await resultResponse.json();
			const taskResult = result.data;

			switch (taskResult.status) {
				case "completed": {
					// Get the media data from the first output URL
					if (!taskResult.outputs?.[0]) {
						throw new InferenceClientProviderOutputError(
							"Received malformed response from WaveSpeed AI API: No output URL in completed response"
						);
					}
					const mediaResponse = await fetch(taskResult.outputs[0]);
					if (!mediaResponse.ok) {
						throw new InferenceClientProviderApiError(
							"Failed to fetch generation output from WaveSpeed AI API",
							{ url: taskResult.outputs[0], method: "GET" },
							{
								requestId: mediaResponse.headers.get("x-request-id") ?? "",
								status: mediaResponse.status,
								body: await mediaResponse.text(),
							}
						);
					}
					return await mediaResponse.blob();
				}
				case "failed": {
					throw new InferenceClientProviderOutputError(taskResult.error || "Task failed");
				}

				default: {
					// Wait before polling again
					await delay(500);
					continue;
				}
			}
		}
	}
}

export class WavespeedAITextToImageTask extends WavespeedAITask implements TextToImageTaskHelper {
	constructor() {
		super(WAVESPEEDAI_API_BASE_URL);
	}
}

export class WavespeedAITextToVideoTask extends WavespeedAITask implements TextToVideoTaskHelper {
	constructor() {
		super(WAVESPEEDAI_API_BASE_URL);
	}
}

export class WavespeedAIImageToImageTask extends WavespeedAITask implements ImageToImageTaskHelper {
	constructor() {
		super(WAVESPEEDAI_API_BASE_URL);
	}

	async preparePayloadAsync(args: ImageToImageArgs): Promise<RequestArgs> {
		return {
			...args,
			inputs: args.parameters?.prompt,
			image: base64FromBytes(
				new Uint8Array(args.inputs instanceof ArrayBuffer ? args.inputs : await (args.inputs as Blob).arrayBuffer())
			),
		};
	}
}
