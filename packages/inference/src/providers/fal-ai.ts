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
import { InferenceOutputError } from "../lib/InferenceOutputError";
import { isUrl } from "../lib/isUrl";
import type { BodyParams, HeaderParams, InferenceTask, UrlParams } from "../types";
import { delay } from "../utils/delay";
import { omit } from "../utils/omit";
import { TaskProviderHelper } from "./providerHelper";

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

export class FalAITask extends TaskProviderHelper {
	constructor(task: InferenceTask, url?: string) {
		super("fal-ai", url || "https://fal.run", task);
	}

	override makeBody(params: BodyParams): Record<string, unknown> {
		return params.args;
	}
	override makeRoute(params: UrlParams): string {
		return `/${params.model}`;
	}
	override prepareHeaders(params: HeaderParams): Record<string, string> {
		return {
			Authorization:
				params.authMethod === "provider-key" ? `Key ${params.accessToken}` : `Bearer ${params.accessToken}`,
		};
	}
	/* eslint-disable @typescript-eslint/no-unused-vars */
	override getResponse(
		response: unknown,
		url?: string,
		headers?: Record<string, string>,
		outputType?: "url" | "blob"
	): unknown {
		throw new Error("Method not implemented");
	}
	/* eslint-enable @typescript-eslint/no-unused-vars */
}

export class FalAITextToImageTask extends FalAITask {
	constructor() {
		super("text-to-image");
	}
	override makeBody(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
			sync_mode: true,
		};
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

export class FalAITextToVideoTask extends FalAITask {
	constructor() {
		super("text-to-video", "https://queue.fal.run");
	}
	override makeRoute(params: UrlParams): string {
		if (params.authMethod !== "provider-key") {
			return `/${params.model}?_subdomain=queue`;
		}
		return `/${params.model}`;
	}
	override makeBody(params: BodyParams): Record<string, unknown> {
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
