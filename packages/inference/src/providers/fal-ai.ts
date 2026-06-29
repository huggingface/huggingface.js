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
import { base64FromBytes } from "../utils/base64FromBytes.js";
import { dataUrlFromBlob } from "../utils/dataUrlFromBlob.js";

import type { AutomaticSpeechRecognitionOutput, ImageSegmentationOutput } from "@huggingface/tasks";
import { isUrl } from "../lib/isUrl.js";
import type { BodyParams, HeaderParams, InferenceTask, ModelId, OutputType, RequestArgs, UrlParams } from "../types.js";
import { delay } from "../utils/delay.js";
import { omit } from "../utils/omit.js";
import type {
	AudioToAudioTaskHelper,
	ImageSegmentationTaskHelper,
	ImageToImageTaskHelper,
	ImageTextToImageTaskHelper,
	ImageTextToVideoTaskHelper,
} from "./providerHelper.js";
import {
	type AutomaticSpeechRecognitionTaskHelper,
	TaskProviderHelper,
	type TextToAudioTaskHelper,
	type TextToImageTaskHelper,
	type TextToVideoTaskHelper,
	type ImageToVideoTaskHelper,
} from "./providerHelper.js";
import { HF_HUB_URL } from "../config.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";
import type { AudioToAudioArgs, AudioToAudioOutput } from "../tasks/audio/audioToAudio.js";
import {
	InferenceClientInputError,
	InferenceClientProviderApiError,
	InferenceClientProviderOutputError,
} from "../errors.js";
import type { ImageToImageArgs, ImageToVideoArgs } from "../tasks/index.js";
import type { ImageTextToImageArgs } from "../tasks/cv/imageTextToImage.js";
import type { ImageTextToVideoArgs } from "../tasks/cv/imageTextToVideo.js";
import type { ImageSegmentationArgs } from "../tasks/cv/imageSegmentation.js";

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
	// Transcript under `text` (whisper) or `output` (nemotron); optional timestamps as `chunks` or `segments`.
	text?: string;
	output?: string;
	chunks?: Array<{ text?: string; timestamp?: number[] }>;
	segments?: Array<{ text?: string; start?: number; end?: number }>;
}

interface FalAITextToSpeechOutput {
	audio: {
		url: string;
		content_type: string;
	};
}
// fal's data-URL decoder maps the declared MIME type to a file extension and rejects
// anything that doesn't resolve to one — so the label matters, not just the bytes. The
// browser's MediaRecorder emits "audio/webm" and file uploads are often "audio/wav",
// neither of which fal accepts; the same bytes are accepted under a label it can map.
// Verified against fal-ai/whisper: audio/mpeg, audio/x-wav and video/webm decode, while
// audio/wav, audio/webm, audio/mp4, audio/x-m4a and audio/ogg return "Unsupported data URL".
const FAL_AI_AUDIO_MIME_MAP: Record<string, string> = {
	"audio/mpeg": "audio/mpeg",
	"audio/mp3": "audio/mpeg",
	"audio/wav": "audio/x-wav",
	"audio/wave": "audio/x-wav",
	"audio/x-wav": "audio/x-wav",
	"audio/webm": "video/webm",
	"video/webm": "video/webm",
};
export const FAL_AI_SUPPORTED_BLOB_TYPES = Object.keys(FAL_AI_AUDIO_MIME_MAP);

function getFalAiAudioDataUrlContentType(contentType: string): string {
	const baseContentType = contentType.split(";")[0].trim().toLowerCase();
	const falContentType = FAL_AI_AUDIO_MIME_MAP[baseContentType];
	if (!falContentType) {
		throw new InferenceClientInputError(
			`Provider fal-ai does not support blob type ${contentType} - supported content types are: ${FAL_AI_SUPPORTED_BLOB_TYPES.join(
				", ",
			)}`,
		);
	}
	return falContentType;
}

async function buildFalAiAudioDataUrl(blob: Blob): Promise<string> {
	const contentType = blob.type;
	if (!contentType) {
		throw new InferenceClientInputError(
			`Unable to determine the input's content-type. Make sure your are passing a Blob when using provider fal-ai.`,
		);
	}
	const falContentType = getFalAiAudioDataUrlContentType(contentType);
	const base64audio = base64FromBytes(new Uint8Array(await blob.arrayBuffer()));
	return `data:${falContentType};base64,${base64audio}`;
}

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

abstract class FalAiQueueTask extends FalAITask {
	abstract task: InferenceTask;

	override makeRoute(params: UrlParams): string {
		if (params.authMethod !== "provider-key") {
			return `/${params.model}?_subdomain=queue`;
		}
		return `/${params.model}`;
	}
	async getResponseFromQueueApi(
		response: FalAiQueueOutput,
		url?: string,
		headers?: Record<string, string>,
		signal?: AbortSignal,
	): Promise<unknown> {
		if (!url || !headers) {
			throw new InferenceClientInputError(`URL and headers are required for ${this.task} task`);
		}
		const requestId = response.request_id;
		if (!requestId) {
			throw new InferenceClientProviderOutputError(
				`Received malformed response from Fal.ai ${this.task} API: no request ID found in the response`,
			);
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
			await delay(500, signal);
			const statusResponse = await fetch(statusUrl, { headers, signal });

			if (!statusResponse.ok) {
				throw new InferenceClientProviderApiError(
					"Failed to fetch response status from fal-ai API",
					{ url: statusUrl, method: "GET" },
					{
						requestId: statusResponse.headers.get("x-request-id") ?? "",
						status: statusResponse.status,
						body: await statusResponse.text(),
					},
				);
			}
			try {
				status = (await statusResponse.json()).status;
			} catch (error) {
				throw new InferenceClientProviderOutputError(
					"Failed to parse status response from fal-ai API: received malformed response",
				);
			}
		}

		const resultResponse = await fetch(resultUrl, { headers, signal });
		let result: unknown;
		try {
			result = await resultResponse.json();
		} catch (error) {
			throw new InferenceClientProviderOutputError(
				"Failed to parse result response from fal-ai API: received malformed response",
			);
		}
		return result;
	}
}

function buildLoraPath(modelId: ModelId, adapterWeightsPath: string): string {
	return `${HF_HUB_URL}/${modelId}/resolve/main/${adapterWeightsPath}`;
}

export class FalAITextToImageTask extends FalAiQueueTask implements TextToImageTaskHelper {
	task: InferenceTask;

	constructor() {
		super("https://queue.fal.run");
		this.task = "text-to-image";
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		const payload: Record<string, unknown> = {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
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

	override async getResponse(
		response: FalAiQueueOutput,
		url?: string,
		headers?: Record<string, string>,
		outputType?: OutputType,
		signal?: AbortSignal,
	): Promise<string | Blob | Record<string, unknown>> {
		const result = (await this.getResponseFromQueueApi(response, url, headers, signal)) as FalAITextToImageOutput;
		if (
			typeof result === "object" &&
			"images" in result &&
			Array.isArray(result.images) &&
			result.images.length > 0 &&
			"url" in result.images[0] &&
			typeof result.images[0].url === "string" &&
			isUrl(result.images[0].url)
		) {
			if (outputType === "json") {
				return { ...result };
			}
			if (outputType === "url") {
				return result.images[0].url;
			}
			const urlResponse = await fetch(result.images[0].url, { signal });
			const blob = await urlResponse.blob();
			return outputType === "dataUrl" ? dataUrlFromBlob(blob) : blob;
		}

		throw new InferenceClientProviderOutputError(
			`Received malformed response from Fal.ai text-to-image API: expected { images: Array<{ url: string }> } result format, got instead: ${JSON.stringify(
				result,
			)}`,
		);
	}
}

export class FalAIImageToImageTask extends FalAiQueueTask implements ImageToImageTaskHelper {
	task: InferenceTask;
	constructor() {
		super("https://queue.fal.run");
		this.task = "image-to-image";
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		const payload = params.args;
		if (params.mapping?.adapter === "lora" && params.mapping.adapterWeightsPath) {
			payload.loras = [
				{
					path: buildLoraPath(params.mapping.hfModelId, params.mapping.adapterWeightsPath),
					scale: 1,
				},
			];
		}
		return payload;
	}

	async preparePayloadAsync(args: ImageToImageArgs): Promise<RequestArgs> {
		const mimeType = args.inputs instanceof Blob ? args.inputs.type : "image/png";
		const imageDataUrl = `data:${mimeType};base64,${base64FromBytes(
			new Uint8Array(args.inputs instanceof ArrayBuffer ? args.inputs : await (args.inputs as Blob).arrayBuffer()),
		)}`;
		return {
			...omit(args, ["inputs", "parameters"]),
			...args.parameters,
			image_url: imageDataUrl,
			// Some fal endpoints (e.g. FLUX.2-dev) expect `image_urls` (array) instead of `image_url`
			image_urls: [imageDataUrl],
		} as RequestArgs;
	}

	override async getResponse(
		response: FalAiQueueOutput,
		url?: string,
		headers?: Record<string, string>,
		_outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob> {
		const result = await this.getResponseFromQueueApi(response, url, headers, signal);

		if (
			typeof result === "object" &&
			!!result &&
			"images" in result &&
			Array.isArray(result.images) &&
			result.images.length > 0 &&
			typeof result.images[0] === "object" &&
			!!result.images[0] &&
			"url" in result.images[0] &&
			typeof result.images[0].url === "string" &&
			isUrl(result.images[0].url)
		) {
			const urlResponse = await fetch(result.images[0].url, { signal });
			return await urlResponse.blob();
		} else {
			throw new InferenceClientProviderOutputError(
				`Received malformed response from Fal.ai image-to-image API: expected { images: Array<{ url: string }> } result format, got instead: ${JSON.stringify(
					result,
				)}`,
			);
		}
	}
}

export class FalAIImageTextToImageTask extends FalAIImageToImageTask implements ImageTextToImageTaskHelper {
	constructor() {
		super();
		this.task = "image-text-to-image";
	}

	override async preparePayloadAsync(args: ImageTextToImageArgs): Promise<RequestArgs> {
		if (args.inputs) {
			return super.preparePayloadAsync(args as ImageToImageArgs);
		}
		return {
			...omit(args, ["inputs", "parameters"]),
			...(args.parameters as Record<string, unknown>),
			prompt: args.parameters?.prompt,
			urlTransform: (url) => {
				const urlObj = new URL(url);
				// Strip last path segment: fal-ai/flux-2/edit => fal-ai/flux-2
				urlObj.pathname = urlObj.pathname.split("/").slice(0, -1).join("/");
				return urlObj.toString();
			},
		} as RequestArgs;
	}
}

export class FalAITextToVideoTask extends FalAiQueueTask implements TextToVideoTaskHelper {
	task: InferenceTask;
	constructor() {
		super("https://queue.fal.run");
		this.task = "text-to-video";
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
		headers?: Record<string, string>,
		_outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob> {
		const result = await this.getResponseFromQueueApi(response, url, headers, signal);

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
			const urlResponse = await fetch(result.video.url, { signal });
			return await urlResponse.blob();
		} else {
			throw new InferenceClientProviderOutputError(
				`Received malformed response from Fal.ai text-to-video API: expected { video: { url: string } } result format, got instead: ${JSON.stringify(
					result,
				)}`,
			);
		}
	}
}

export class FalAIImageToVideoTask extends FalAiQueueTask implements ImageToVideoTaskHelper {
	task: InferenceTask;

	constructor() {
		super("https://queue.fal.run");
		this.task = "image-to-video";
	}

	/** Synchronous case – caller already gave us base64 or a URL */
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			// args.inputs is expected to be a base64 data URI or an URL
			image_url: params.args.image_url,
		};
	}

	/** Asynchronous helper – caller gave us a Blob */
	async preparePayloadAsync(args: ImageToVideoArgs): Promise<RequestArgs> {
		const mimeType = args.inputs instanceof Blob ? args.inputs.type : "image/png";
		return {
			...omit(args, ["inputs", "parameters"]),
			image_url: `data:${mimeType};base64,${base64FromBytes(
				new Uint8Array(args.inputs instanceof ArrayBuffer ? args.inputs : await (args.inputs as Blob).arrayBuffer()),
			)}`,
			...args.parameters,
			...args,
		};
	}

	/** Queue polling + final download – mirrors Text‑to‑Video */
	override async getResponse(
		response: FalAiQueueOutput,
		url?: string,
		headers?: Record<string, string>,
		_outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob> {
		const result = await this.getResponseFromQueueApi(response, url, headers, signal);

		if (
			typeof result === "object" &&
			result !== null &&
			"video" in result &&
			typeof result.video === "object" &&
			result.video !== null &&
			"url" in result.video &&
			typeof result.video.url === "string" &&
			"url" in result.video &&
			isUrl(result.video.url)
		) {
			const urlResponse = await fetch(result.video.url, { signal });
			return await urlResponse.blob();
		}

		throw new InferenceClientProviderOutputError(
			`Received malformed response from Fal.ai image‑to‑video API: expected { video: { url: string } }, got: ${JSON.stringify(
				result,
			)}`,
		);
	}
}

export class FalAIImageTextToVideoTask extends FalAIImageToVideoTask implements ImageTextToVideoTaskHelper {
	constructor() {
		super();
		this.task = "image-text-to-video";
	}

	override async preparePayloadAsync(args: ImageTextToVideoArgs): Promise<RequestArgs> {
		if (args.inputs) {
			return super.preparePayloadAsync(args as ImageToVideoArgs);
		}
		return {
			...omit(args, ["inputs", "parameters"]),
			...(args.parameters as Record<string, unknown>),
			prompt: args.parameters?.prompt,
			urlTransform: (url) => {
				const urlObj = new URL(url);
				urlObj.pathname = urlObj.pathname.split("/").slice(0, -1).join("/");
				return urlObj.toString();
			},
		} as RequestArgs;
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
		const text = typeof res?.text === "string" ? res.text : typeof res?.output === "string" ? res.output : undefined;
		if (typeof text !== "string") {
			throw new InferenceClientProviderOutputError(
				`Received malformed response from Fal.ai Automatic Speech Recognition API: expected { text: string } or { output: string } format, got instead: ${JSON.stringify(
					response,
				)}`,
			);
		}
		const output: AutomaticSpeechRecognitionOutput = { text };
		const chunks = Array.isArray(res.chunks)
			? res.chunks
					.filter((c) => typeof c?.text === "string" && Array.isArray(c.timestamp))
					.map((c) => ({ text: c.text as string, timestamp: c.timestamp as number[] }))
			: Array.isArray(res.segments)
				? res.segments
						.filter((s) => typeof s?.text === "string")
						.map((s) => ({ text: s.text as string, timestamp: [s.start ?? 0, s.end ?? 0] }))
				: [];
		if (chunks.length > 0) {
			output.chunks = chunks;
		}
		return output;
	}

	async preparePayloadAsync(args: AutomaticSpeechRecognitionArgs): Promise<RequestArgs> {
		const blob = "data" in args && args.data instanceof Blob ? args.data : "inputs" in args ? args.inputs : undefined;
		if (!(blob instanceof Blob)) {
			throw new InferenceClientInputError(
				`Unable to determine the input's content-type. Make sure your are passing a Blob when using provider fal-ai.`,
			);
		}
		return {
			...("data" in args ? omit(args, "data") : omit(args, "inputs")),
			audio_url: await buildFalAiAudioDataUrl(blob),
		};
	}
}

export class FalAITextToSpeechTask extends FalAITask {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			text: params.args.inputs,
		};
	}

	override async getResponse(
		response: unknown,
		_url?: string,
		_headers?: HeadersInit,
		_outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob> {
		const res = response as FalAITextToSpeechOutput;
		if (typeof res?.audio?.url !== "string") {
			throw new InferenceClientProviderOutputError(
				`Received malformed response from Fal.ai Text-to-Speech API: expected { audio: { url: string } } format, got instead: ${JSON.stringify(
					response,
				)}`,
			);
		}
		const urlResponse = await fetch(res.audio.url, { signal });
		if (!urlResponse.ok) {
			throw new InferenceClientProviderApiError(
				`Failed to fetch audio from ${res.audio.url}: ${urlResponse.statusText}`,
				{ url: res.audio.url, method: "GET", headers: { "Content-Type": "application/json" } },
				{
					requestId: urlResponse.headers.get("x-request-id") ?? "",
					status: urlResponse.status,
					body: await urlResponse.text(),
				},
			);
		}
		try {
			return await urlResponse.blob();
		} catch (error) {
			throw new InferenceClientProviderApiError(
				`Failed to fetch audio from ${res.audio.url}: ${error instanceof Error ? error.message : String(error)}`,
				{ url: res.audio.url, method: "GET", headers: { "Content-Type": "application/json" } },
				{
					requestId: urlResponse.headers.get("x-request-id") ?? "",
					status: urlResponse.status,
					body: await urlResponse.text(),
				},
			);
		}
	}
}

interface FalAITextToAudioResult {
	audio_file?: { url: string; content_type?: string };
	audio?: { url: string; content_type?: string };
}

export class FalAITextToAudioTask extends FalAiQueueTask implements TextToAudioTaskHelper {
	task: InferenceTask;

	constructor() {
		super("https://queue.fal.run");
		this.task = "text-to-audio";
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
		headers?: Record<string, string>,
		_outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob> {
		const result = (await this.getResponseFromQueueApi(response, url, headers, signal)) as FalAITextToAudioResult;
		const audio = result.audio_file ?? result.audio;
		if (typeof audio !== "object" || !audio || typeof audio.url !== "string" || !isUrl(audio.url)) {
			throw new InferenceClientProviderOutputError(
				`Received malformed response from Fal.ai text-to-audio API: expected { audio_file: { url: string } } or { audio: { url: string } } result format, got instead: ${JSON.stringify(
					result,
				)}`,
			);
		}

		const audioResponse = await fetch(audio.url, { signal });
		if (!audioResponse.ok) {
			throw new InferenceClientProviderApiError(
				`Failed to fetch audio from ${audio.url}: ${audioResponse.statusText}`,
				{ url: audio.url, method: "GET" },
				{
					requestId: audioResponse.headers.get("x-request-id") ?? "",
					status: audioResponse.status,
					body: await audioResponse.text(),
				},
			);
		}
		return await audioResponse.blob();
	}
}

interface FalAIAudioToAudioResult {
	audio: { url: string; content_type?: string };
	text?: string;
}

export class FalAIAudioToAudioTask extends FalAiQueueTask implements AudioToAudioTaskHelper {
	task: InferenceTask;

	constructor() {
		super("https://queue.fal.run");
		this.task = "audio-to-audio";
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters", "data"]),
			...(params.args.parameters as Record<string, unknown>),
		};
	}

	async preparePayloadAsync(args: AudioToAudioArgs): Promise<RequestArgs> {
		const blob = "data" in args && args.data instanceof Blob ? args.data : "inputs" in args ? args.inputs : undefined;
		if (!(blob instanceof Blob)) {
			throw new InferenceClientInputError(
				`Expected a Blob input for audio-to-audio with provider fal-ai, got ${typeof blob}.`,
			);
		}
		return {
			...("data" in args ? omit(args, "data") : omit(args, "inputs")),
			audio_url: await buildFalAiAudioDataUrl(blob),
		};
	}

	override async getResponse(
		response: FalAiQueueOutput,
		url?: string,
		headers?: Record<string, string>,
		_outputType?: undefined,
		signal?: AbortSignal,
	): Promise<AudioToAudioOutput[]> {
		const result = (await this.getResponseFromQueueApi(response, url, headers, signal)) as FalAIAudioToAudioResult;
		if (
			typeof result !== "object" ||
			!result ||
			typeof result.audio !== "object" ||
			!result.audio ||
			typeof result.audio.url !== "string" ||
			!isUrl(result.audio.url)
		) {
			throw new InferenceClientProviderOutputError(
				`Received malformed response from Fal.ai audio-to-audio API: expected { audio: { url: string } } result format, got instead: ${JSON.stringify(
					result,
				)}`,
			);
		}

		const audioResponse = await fetch(result.audio.url, { signal });
		if (!audioResponse.ok) {
			throw new InferenceClientProviderApiError(
				`Failed to fetch audio from ${result.audio.url}: ${audioResponse.statusText}`,
				{ url: result.audio.url, method: "GET" },
				{
					requestId: audioResponse.headers.get("x-request-id") ?? "",
					status: audioResponse.status,
					body: await audioResponse.text(),
				},
			);
		}
		const audioBytes = new Uint8Array(await audioResponse.arrayBuffer());
		const contentType = result.audio.content_type ?? audioResponse.headers.get("content-type") ?? "audio/wav";
		return [
			{
				blob: base64FromBytes(audioBytes),
				"content-type": contentType,
				label: typeof result.text === "string" && result.text.length > 0 ? result.text : "speech",
			},
		];
	}
}

export class FalAIImageSegmentationTask extends FalAiQueueTask implements ImageSegmentationTaskHelper {
	task: InferenceTask;
	constructor() {
		super("https://queue.fal.run");
		this.task = "image-segmentation";
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			sync_mode: true,
		};
	}

	async preparePayloadAsync(args: ImageSegmentationArgs): Promise<RequestArgs> {
		const blob = "data" in args && args.data instanceof Blob ? args.data : "inputs" in args ? args.inputs : undefined;
		const mimeType = blob instanceof Blob ? blob.type : "image/png";
		const base64Image = base64FromBytes(
			new Uint8Array(blob instanceof ArrayBuffer ? blob : await (blob as Blob).arrayBuffer()),
		);
		return {
			...omit(args, ["inputs", "parameters", "data"]),
			...args.parameters,
			...args,
			image_url: `data:${mimeType};base64,${base64Image}`,
			sync_mode: true,
		};
	}

	override async getResponse(
		response: FalAiQueueOutput,
		url?: string,
		headers?: Record<string, string>,
		_outputType?: undefined,
		signal?: AbortSignal,
	): Promise<ImageSegmentationOutput> {
		const result = await this.getResponseFromQueueApi(response, url, headers, signal);
		if (
			typeof result === "object" &&
			result !== null &&
			"image" in result &&
			typeof result.image === "object" &&
			result.image !== null &&
			"url" in result.image &&
			typeof result.image.url === "string"
		) {
			const maskResponse = await fetch(result.image.url, { signal });
			if (!maskResponse.ok) {
				throw new InferenceClientProviderApiError(
					`Failed to fetch segmentation mask from ${result.image.url}`,
					{ url: result.image.url, method: "GET" },
					{
						requestId: maskResponse.headers.get("x-request-id") ?? "",
						status: maskResponse.status,
						body: await maskResponse.text(),
					},
				);
			}
			const maskBlob = await maskResponse.blob();
			const maskArrayBuffer = await maskBlob.arrayBuffer();
			const maskBase64 = base64FromBytes(new Uint8Array(maskArrayBuffer));

			return [
				{
					label: "mask", // placeholder label, as Fal does not provide labels in the response(?)
					score: 1.0, // placeholder score, as Fal does not provide scores in the response(?)
					mask: maskBase64,
				},
			];
		}

		throw new InferenceClientProviderOutputError(
			`Received malformed response from Fal.ai image-segmentation API: expected { image: { url: string } } format, got instead: ${JSON.stringify(
				response,
			)}`,
		);
	}
}
