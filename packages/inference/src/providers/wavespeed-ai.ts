import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams, HeaderParams, UrlParams } from "../types";
import { delay } from "../utils/delay";
import { omit } from "../utils/omit";
import {
	TaskProviderHelper,
	TextToImageTaskHelper,
	TextToVideoTaskHelper,
	ImageToImageTaskHelper,
} from "./providerHelper";

const WAVESPEEDAI_API_BASE_URL = "https://api.wavespeed.ai";

/**
 * Common response structure for all WaveSpeed AI API responses
 */
interface WaveSpeedAICommonResponse<T> {
	code: number;
	message: string;
	data: T;
}

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

type WaveSpeedAIResponse<T = WaveSpeedAITaskResponse> = WaveSpeedAICommonResponse<T>;

abstract class WavespeedAITask extends TaskProviderHelper {
	private accessToken: string | undefined;

	constructor(url?: string) {
		super("wavespeed-ai", url || WAVESPEEDAI_API_BASE_URL);
	}

	makeRoute(params: UrlParams): string {
		return `/api/v2/${params.model}`;
	}
	preparePayload(params: BodyParams): Record<string, unknown> {
		console.log("params", params);
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
		};
	}

	override prepareHeaders(params: HeaderParams, isBinary: boolean): Record<string, string> {
		this.accessToken = params.accessToken;
		const headers: Record<string, string> = { Authorization: `Bearer ${params.accessToken}` };
		if (!isBinary) {
			headers["Content-Type"] = "application/json";
		}
		return headers;
	}

	override async getResponse(
		response: WaveSpeedAIResponse<WaveSpeedAISubmitResponse>,
		url?: string,
		headers?: Record<string, string>
	): Promise<Blob> {
		console.log("getResponse headers", headers);
		console.log("getResponse response", response);
		console.log("getResponse url", url);

		if (!headers && this.accessToken) {
			headers = { Authorization: `Bearer ${this.accessToken}` };
		}
		if (!headers) {
			throw new InferenceOutputError("Headers are required for WaveSpeed AI API calls");
		}

		const resultUrl = response.data.urls.get;
		console.log("getResponse resultUrl", resultUrl);

		// Poll for results until completion
		while (true) {
			const resultResponse = await fetch(resultUrl, { headers });

			if (!resultResponse.ok) {
				throw new InferenceOutputError(`Failed to get result: ${resultResponse.statusText}`);
			}

			const result: WaveSpeedAIResponse = await resultResponse.json();
			if (result.code !== 200) {
				throw new InferenceOutputError(`API request failed with code ${result.code}: ${result.message}`);
			}

			const taskResult = result.data;

			switch (taskResult.status) {
				case "completed": {
					// Get the video data from the first output URL
					if (!taskResult.outputs?.[0]) {
						throw new InferenceOutputError("No video URL in completed response");
					}
					const videoResponse = await fetch(taskResult.outputs[0]);
					if (!videoResponse.ok) {
						throw new InferenceOutputError("Failed to fetch video data");
					}
					return await videoResponse.blob();
				}
				case "failed": {
					throw new InferenceOutputError(taskResult.error || "Task failed");
				}
				case "processing":
				case "created":
					// Wait before polling again
					await delay(100);
					continue;

				default: {
					throw new InferenceOutputError(`Unknown status: ${taskResult.status}`);
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

	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			image: params.args.inputs,
		};
	}
}

export class WavespeedAIImageToVideoTask extends WavespeedAITask implements TextToVideoTaskHelper {
	constructor() {
		super(WAVESPEEDAI_API_BASE_URL);
	}
}
