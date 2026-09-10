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
import { isUrl } from "../lib/isUrl.js";
import type { ImageTextToVideoArgs } from "../tasks/cv/imageTextToVideo.js";
import type { TextToVideoArgs } from "../tasks/index.js";
import type { BodyParams, RequestArgs, UrlParams } from "../types.js";
import { dataUrlFromBlob } from "../utils/dataUrlFromBlob.js";
import { delay } from "../utils/delay.js";
import { omit } from "../utils/omit.js";
import {
	BaseConversationalTask,
	BaseTextGenerationTask,
	type ImageTextToVideoTaskHelper,
	TaskProviderHelper,
	type TextToVideoTaskHelper,
} from "./providerHelper.js";
import {
	InferenceClientInputError,
	InferenceClientProviderApiError,
	InferenceClientProviderOutputError,
} from "../errors.js";

const NOVITA_API_BASE_URL = "https://api.novita.ai";
const NOVITA_MINIMAX_H3_RATIOS = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] as const;

function getMiniMaxH3Duration(numFrames?: number): number {
	return numFrames === undefined ? 4 : Math.min(15, Math.max(4, Math.round(numFrames / 24)));
}

function getMiniMaxH3Resolution(targetSize?: { width: number; height: number }): "768P" | "2K" {
	if (!targetSize) {
		return "768P";
	}
	const shortEdge = Math.min(targetSize.width, targetSize.height);
	return Math.abs(shortEdge - 768) <= Math.abs(shortEdge - 1440) ? "768P" : "2K";
}

function getMiniMaxH3Ratio(targetSize?: { width: number; height: number }): (typeof NOVITA_MINIMAX_H3_RATIOS)[number] {
	if (!targetSize) {
		return "16:9";
	}
	const targetRatio = targetSize.width / targetSize.height;
	return NOVITA_MINIMAX_H3_RATIOS.reduce((closest, ratio) => {
		const [width, height] = ratio.split(":").map(Number);
		const [closestWidth, closestHeight] = closest.split(":").map(Number);
		return Math.abs(targetRatio - width / height) < Math.abs(targetRatio - closestWidth / closestHeight)
			? ratio
			: closest;
	});
}

export interface NovitaAsyncAPIOutput {
	task_id: string;
}

interface NovitaImageTextToVideoResponse {
	task: {
		status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
		content?: { url: string };
		error?: { message?: string };
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

export class NovitaImageTextToVideoTask extends TaskProviderHelper implements ImageTextToVideoTaskHelper {
	constructor() {
		super("novita", NOVITA_API_BASE_URL);
	}

	override makeRoute(params: UrlParams): string {
		if (params.model !== "MiniMax-H3") {
			throw new InferenceClientInputError(`Unsupported Novita image-text-to-video model: ${params.model}`);
		}
		return "/v3/minimax/v2/video_generation";
	}

	override preparePayload(params: BodyParams<ImageTextToVideoArgs>): Record<string, unknown> {
		const {
			prompt,
			num_frames,
			target_size,
			resolution = getMiniMaxH3Resolution(target_size),
			duration = getMiniMaxH3Duration(num_frames),
			ratio = getMiniMaxH3Ratio(target_size),
			...restParameters
		} = params.args.parameters ?? {};
		const imageUrl = params.args.inputs;

		return {
			...omit(restParameters, ["guidance_scale", "negative_prompt", "num_inference_steps", "seed"]),
			model: params.model,
			content: [
				...(prompt ? [{ type: "text", text: prompt }] : []),
				...(imageUrl ? [{ type: "image_url", image_url: { url: imageUrl }, role: "first_frame" }] : []),
			],
			resolution,
			duration,
			ratio: imageUrl ? "adaptive" : ratio,
		};
	}

	async preparePayloadAsync(args: ImageTextToVideoArgs): Promise<RequestArgs> {
		if (!args.inputs) {
			return args as RequestArgs;
		}
		return {
			...args,
			inputs: await dataUrlFromBlob(args.inputs, args.inputs.type || "image/png"),
		} as RequestArgs;
	}

	override async getResponse(
		response: NovitaAsyncAPIOutput,
		url?: string,
		headers?: Record<string, string>,
		_outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob> {
		if (!url || !headers) {
			throw new InferenceClientInputError("URL and headers are required for Novita API calls");
		}

		const parsedUrl = new URL(url);
		const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${
			parsedUrl.host === "router.huggingface.co" ? "/novita" : ""
		}`;
		const resultUrl = `${baseUrl}/v3/minimax/v2/query/video_generation/${encodeURIComponent(response.task_id)}`;

		while (true) {
			const resultResponse = await fetch(resultUrl, { headers, signal });
			if (!resultResponse.ok) {
				throw new InferenceClientProviderApiError(
					"Failed to fetch response status from Novita API",
					{ url: resultUrl, method: "GET", headers },
					{
						requestId: resultResponse.headers.get("x-request-id") ?? "",
						status: resultResponse.status,
						body: await resultResponse.text(),
					},
				);
			}

			const result: NovitaImageTextToVideoResponse = await resultResponse.json();
			const task = result.task;

			switch (task.status) {
				case "succeeded": {
					if (!task.content?.url) {
						throw new InferenceClientProviderOutputError("No output URL returned by Novita API");
					}
					const videoResponse = await fetch(task.content.url, { signal });
					if (!videoResponse.ok) {
						throw new InferenceClientProviderApiError(
							"Failed to fetch generation output from Novita API",
							{ url: task.content.url, method: "GET" },
							{
								requestId: videoResponse.headers.get("x-request-id") ?? "",
								status: videoResponse.status,
								body: await videoResponse.text(),
							},
						);
					}
					return videoResponse.blob();
				}
				case "failed":
				case "cancelled":
					throw new InferenceClientProviderOutputError(task.error?.message || `Novita task ${task.status}`);
				default:
					await delay(5000, signal);
			}
		}
	}
}

export class NovitaTextToVideoTask extends TaskProviderHelper implements TextToVideoTaskHelper {
	constructor() {
		super("novita", NOVITA_API_BASE_URL);
	}

	override makeRoute(params: UrlParams): string {
		return `/v3/async/${params.model}`;
	}

	override preparePayload(params: BodyParams<TextToVideoArgs>): Record<string, unknown> {
		const { num_inference_steps, ...restParameters } = params.args.parameters ?? {};
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...restParameters,
			steps: num_inference_steps,
			prompt: params.args.inputs,
		};
	}

	override async getResponse(
		response: NovitaAsyncAPIOutput,
		url?: string,
		headers?: Record<string, string>,
		_outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob> {
		if (!url || !headers) {
			throw new InferenceClientInputError("URL and headers are required for text-to-video task");
		}
		const taskId = response.task_id;
		if (!taskId) {
			throw new InferenceClientProviderOutputError(
				"Received malformed response from Novita text-to-video API: no task ID found in the response",
			);
		}

		const parsedUrl = new URL(url);
		const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${
			parsedUrl.host === "router.huggingface.co" ? "/novita" : ""
		}`;
		const resultUrl = `${baseUrl}/v3/async/task-result?task_id=${taskId}`;

		let status = "";
		let taskResult: unknown;

		while (status !== "TASK_STATUS_SUCCEED" && status !== "TASK_STATUS_FAILED") {
			await delay(500, signal);
			const resultResponse = await fetch(resultUrl, { headers, signal });
			if (!resultResponse.ok) {
				throw new InferenceClientProviderApiError(
					"Failed to fetch task result",
					{ url: resultUrl, method: "GET", headers },
					{
						requestId: resultResponse.headers.get("x-request-id") ?? "",
						status: resultResponse.status,
						body: await resultResponse.text(),
					},
				);
			}
			try {
				taskResult = await resultResponse.json();
				if (
					taskResult &&
					typeof taskResult === "object" &&
					"task" in taskResult &&
					taskResult.task &&
					typeof taskResult.task === "object" &&
					"status" in taskResult.task &&
					typeof taskResult.task.status === "string"
				) {
					status = taskResult.task.status;
				} else {
					throw new InferenceClientProviderOutputError(
						"Received malformed response from Novita text-to-video API: failed to get task status",
					);
				}
			} catch (error) {
				throw new InferenceClientProviderOutputError(
					"Received malformed response from Novita text-to-video API: failed to parse task result",
				);
			}
		}

		if (status === "TASK_STATUS_FAILED") {
			throw new InferenceClientProviderOutputError("Novita text-to-video task failed");
		}

		if (
			typeof taskResult === "object" &&
			!!taskResult &&
			"videos" in taskResult &&
			typeof taskResult.videos === "object" &&
			!!taskResult.videos &&
			Array.isArray(taskResult.videos) &&
			taskResult.videos.length > 0 &&
			"video_url" in taskResult.videos[0] &&
			typeof taskResult.videos[0].video_url === "string" &&
			isUrl(taskResult.videos[0].video_url)
		) {
			const urlResponse = await fetch(taskResult.videos[0].video_url, { signal });
			return await urlResponse.blob();
		} else {
			throw new InferenceClientProviderOutputError(
				`Received malformed response from Novita text-to-video API: expected { videos: [{ video_url: string }] } format, got instead: ${JSON.stringify(
					taskResult,
				)}`,
			);
		}
	}
}
