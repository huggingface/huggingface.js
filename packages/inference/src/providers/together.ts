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
import type {
	AutomaticSpeechRecognitionOutput,
	ChatCompletionOutput,
	FeatureExtractionOutput,
	TextGenerationOutput,
	TextGenerationOutputFinishReason,
} from "@huggingface/tasks";
import type { BodyParams, OutputType, RequestArgs } from "../types.js";
import { delay } from "../utils/delay.js";
import { omit } from "../utils/omit.js";
import { dataUrlFromBlob } from "../utils/dataUrlFromBlob.js";
import {
	BaseConversationalTask,
	BaseTextGenerationTask,
	TaskProviderHelper,
	type AutomaticSpeechRecognitionTaskHelper,
	type FeatureExtractionTaskHelper,
	type ImageToImageTaskHelper,
	type ImageToVideoTaskHelper,
	type TextToImageTaskHelper,
	type TextToSpeechTaskHelper,
	type TextToVideoTaskHelper,
} from "./providerHelper.js";
import {
	InferenceClientInputError,
	InferenceClientProviderApiError,
	InferenceClientProviderOutputError,
} from "../errors.js";
import type { ChatCompletionInput } from "../../../tasks/dist/commonjs/index.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";
import type { ImageToImageArgs } from "../tasks/cv/imageToImage.js";
import type { ImageToVideoArgs } from "../tasks/cv/imageToVideo.js";

const TOGETHER_API_BASE_URL = "https://api.together.xyz";

const AUDIO_MIME_TO_EXT: Record<string, string> = {
	"audio/wav": "wav",
	"audio/x-wav": "wav",
	"audio/wave": "wav",
	"audio/mpeg": "mp3",
	"audio/mp3": "mp3",
	"audio/mp4": "mp4",
	"audio/m4a": "m4a",
	"audio/x-m4a": "m4a",
	"audio/flac": "flac",
	"audio/x-flac": "flac",
	"audio/ogg": "ogg",
	"audio/webm": "webm",
};

function mimeTypeToExtension(mimeType: string | undefined): string {
	if (!mimeType) return "wav";
	return AUDIO_MIME_TO_EXT[mimeType.toLowerCase()] ?? "wav";
}

interface TogetherTextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
	choices: Array<{
		text: string;
		finish_reason: TextGenerationOutputFinishReason;
		seed: number;
		logprobs: unknown;
		index: number;
	}>;
}

interface TogetherImageGeneration {
	data: Array<{
		b64_json?: string;
		url?: string;
	}>;
}

interface TogetherEmbeddingsResponse {
	data: Array<{
		embedding: number[];
		index: number;
		object: string;
	}>;
	model: string;
	object: string;
}

interface TogetherAudioTranscriptionSegment {
	id: number;
	start: number;
	end: number;
	text: string;
}

interface TogetherAudioTranscriptionResponse {
	text: string;
	segments?: TogetherAudioTranscriptionSegment[];
}

interface TogetherVideoJobResponse {
	id: string;
	status?: string;
	outputs?: {
		video_url?: string;
	};
	error?: {
		message?: string;
	};
}

export class TogetherConversationalTask extends BaseConversationalTask {
	constructor() {
		super("together", TOGETHER_API_BASE_URL);
	}

	override preparePayload(params: BodyParams<ChatCompletionInput>): Record<string, unknown> {
		const payload = super.preparePayload(params);
		const response_format = payload.response_format as
			| { type: "json_schema"; json_schema: { schema: unknown } }
			| undefined;

		if (response_format?.type === "json_schema" && response_format?.json_schema?.schema) {
			payload.response_format = {
				type: "json_schema",
				schema: response_format.json_schema.schema,
			};
		}

		return payload;
	}
}

export class TogetherTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("together", TOGETHER_API_BASE_URL);
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			model: params.model,
			...params.args,
			prompt: params.args.inputs,
		};
	}

	override async getResponse(response: TogetherTextCompletionOutput): Promise<TextGenerationOutput> {
		if (
			typeof response === "object" &&
			"choices" in response &&
			Array.isArray(response?.choices) &&
			typeof response?.model === "string"
		) {
			const completion = response.choices[0];
			return {
				generated_text: completion.text,
				details: {
					finish_reason: completion.finish_reason,
					seed: completion.seed,
				} as TextGenerationOutput["details"],
			};
		}
		throw new InferenceClientProviderOutputError("Received malformed response from Together text generation API");
	}
}

export class TogetherTextToImageTask extends TaskProviderHelper implements TextToImageTaskHelper {
	constructor() {
		super("together", TOGETHER_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/images/generations";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		const rawParameters = (params.args.parameters as Record<string, unknown> | undefined) ?? {};
		const { num_inference_steps, ...restParameters } = rawParameters as {
			num_inference_steps?: unknown;
		} & Record<string, unknown>;
		if (num_inference_steps !== undefined) {
			restParameters.steps = num_inference_steps;
		}
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...restParameters,
			prompt: params.args.inputs,
			response_format: params.outputType === "url" ? "url" : "base64",
			model: params.model,
		};
	}

	/** Task label used in malformed-response errors. Overridden by subclasses. */
	protected get imageTaskLabel(): string {
		return "text-to-image";
	}

	async getResponse(
		response: TogetherImageGeneration,
		url?: string,
		headers?: HeadersInit,
		outputType?: OutputType,
		signal?: AbortSignal,
	): Promise<string | Blob | Record<string, unknown>> {
		void url;
		void headers;
		if (
			typeof response === "object" &&
			"data" in response &&
			Array.isArray(response.data) &&
			response.data.length > 0
		) {
			if (outputType === "json") {
				return { ...response };
			}

			if ("url" in response.data[0] && typeof response.data[0].url === "string") {
				return response.data[0].url;
			}

			if ("b64_json" in response.data[0] && typeof response.data[0].b64_json === "string") {
				const base64Data = response.data[0].b64_json;
				if (outputType === "dataUrl") {
					return `data:image/jpeg;base64,${base64Data}`;
				}
				return fetch(`data:image/jpeg;base64,${base64Data}`, { signal }).then((res) => res.blob());
			}
		}

		throw new InferenceClientProviderOutputError(
			`Received malformed response from Together ${this.imageTaskLabel} API`,
		);
	}
}

export class TogetherImageToImageTask extends TogetherTextToImageTask implements ImageToImageTaskHelper {
	protected override get imageTaskLabel(): string {
		return "image-to-image";
	}

	override preparePayload(params: BodyParams<ImageToImageArgs>): Record<string, unknown> {
		const rawParameters = (params.args.parameters as Record<string, unknown> | undefined) ?? {};
		const { prompt, num_inference_steps, ...restParameters } = rawParameters as {
			prompt?: string;
			num_inference_steps?: unknown;
		} & Record<string, unknown>;
		if (num_inference_steps !== undefined) {
			restParameters.steps = num_inference_steps;
		}

		// Together exposes two mutually-exclusive image inputs (see
		// https://docs.together.ai/docs/image-to-image): FLUX.1 Kontext only accepts
		// `image_url`; FLUX.2 [dev] and Google models (Gemini 3 Pro Image, Flash Image
		// 2.5) only accept `reference_images`. FLUX.2 [pro]/[flex] accept either but
		// `reference_images` is the documented default. Use `image_url` only for
		// FLUX.1 Kontext models and `reference_images` for everything else.
		const lowered = params.model.toLowerCase();
		const useImageUrl = lowered.includes("kontext") && lowered.includes("flux.1");
		const imageField: Record<string, unknown> = useImageUrl
			? { image_url: params.args.inputs }
			: { reference_images: [params.args.inputs] };

		return {
			...omit(params.args, ["inputs", "parameters"]),
			prompt: prompt ?? "",
			...imageField,
			...restParameters,
			response_format: "base64",
			model: params.model,
		};
	}

	async preparePayloadAsync(args: ImageToImageArgs): Promise<RequestArgs> {
		const { inputs, ...restArgs } = args;
		if (!(inputs instanceof Blob)) {
			throw new InferenceClientInputError("Together image-to-image expects a Blob input.");
		}
		const imageDataUrl = await dataUrlFromBlob(inputs, inputs.type || "image/jpeg");
		return {
			...restArgs,
			inputs: imageDataUrl,
		};
	}

	override async getResponse(
		response: TogetherImageGeneration,
		url?: string,
		headers?: HeadersInit,
		outputType?: OutputType,
	): Promise<Blob> {
		const result = await super.getResponse(response, url, headers, outputType);
		if (result instanceof Blob) {
			return result;
		}
		throw new InferenceClientProviderOutputError(
			`Received malformed response from Together ${this.imageTaskLabel} API`,
		);
	}
}

// Polling cadence for Together's async video generation.
const TOGETHER_VIDEO_POLLING_INTERVAL_MS = 2000;
// Upper bound on status polls (~5 minutes at TOGETHER_VIDEO_POLLING_INTERVAL_MS).
const TOGETHER_VIDEO_MAX_POLL_ATTEMPTS = 150;
// Statuses that mean "keep polling". Together returns "queued" before transitioning
// to "in_progress"; anything outside this set is treated as terminal.
const TOGETHER_VIDEO_PENDING_STATUSES = new Set(["queued", "in_progress"]);

interface TogetherVideoParameters extends Record<string, unknown> {
	num_inference_steps?: unknown;
	target_size?: { width?: unknown; height?: unknown };
}

/** Renames HF-standard fields to Together's video API field names. */
function normalizeTogetherVideoParameters(parameters: Record<string, unknown> | undefined): Record<string, unknown> {
	const { num_inference_steps, target_size, ...rest } = (parameters ?? {}) as TogetherVideoParameters;
	if (num_inference_steps !== undefined) {
		rest.steps = num_inference_steps;
	}
	if (target_size && typeof target_size === "object") {
		if (target_size.width !== undefined) rest.width = target_size.width;
		if (target_size.height !== undefined) rest.height = target_size.height;
	}
	return rest;
}

/** Shared base for Together's async video tasks (text-to-video, image-to-video). */
abstract class TogetherVideoTask extends TaskProviderHelper {
	constructor() {
		super("together", TOGETHER_API_BASE_URL);
	}

	makeRoute(): string {
		return "v2/videos";
	}

	async getResponse(
		response: TogetherVideoJobResponse,
		url?: string,
		headers?: Record<string, string>,
		_outputType?: OutputType,
		signal?: AbortSignal,
	): Promise<Blob> {
		if (!url || !headers) {
			throw new InferenceClientInputError("URL and headers are required for Together video tasks");
		}
		const jobId = response?.id;
		if (!jobId) {
			throw new InferenceClientProviderOutputError(
				"Received malformed response from Together video API: no job ID found in the response",
			);
		}

		const statusUrl = `${url}/${jobId}`;

		let job: TogetherVideoJobResponse = response;
		let status = job.status;
		let attempt = 0;
		// Together usually returns status: "queued" on the initial POST, but the field is
		// typed as optional — treat a missing status as "pending" and poll, rather than
		// falling through to the "unexpected status" error.
		while (status === undefined || TOGETHER_VIDEO_PENDING_STATUSES.has(status)) {
			if (attempt >= TOGETHER_VIDEO_MAX_POLL_ATTEMPTS) {
				throw new InferenceClientProviderOutputError(
					`Timed out while waiting for Together video generation — aborting after ${TOGETHER_VIDEO_MAX_POLL_ATTEMPTS} status polls`,
				);
			}
			attempt += 1;
			await delay(TOGETHER_VIDEO_POLLING_INTERVAL_MS, signal);
			const pollResponse = await fetch(statusUrl, { headers, signal });
			if (!pollResponse.ok) {
				throw new InferenceClientProviderApiError(
					"Failed to fetch Together video job result",
					{ url: statusUrl, method: "GET", headers },
					{
						requestId: pollResponse.headers.get("x-request-id") ?? "",
						status: pollResponse.status,
						body: await pollResponse.text(),
					},
				);
			}
			try {
				job = (await pollResponse.json()) as TogetherVideoJobResponse;
			} catch {
				throw new InferenceClientProviderOutputError(
					"Received malformed response from Together video API: failed to parse job result",
				);
			}
			status = job.status;
		}

		if (status === "failed") {
			throw new InferenceClientProviderOutputError(
				`Together video generation failed: ${job.error?.message ?? "Unknown error"}`,
			);
		}
		if (status !== "completed") {
			throw new InferenceClientProviderOutputError(`Unexpected Together video job status: ${JSON.stringify(status)}`);
		}

		const videoUrl = job.outputs?.video_url;
		if (typeof videoUrl !== "string") {
			throw new InferenceClientProviderOutputError("No video URL found in completed Together video job.");
		}

		const videoResponse = await fetch(videoUrl, { signal });
		if (!videoResponse.ok) {
			throw new InferenceClientProviderApiError(
				"Failed to download Together video output",
				{ url: videoUrl, method: "GET" },
				{
					requestId: videoResponse.headers.get("x-request-id") ?? "",
					status: videoResponse.status,
					body: await videoResponse.text(),
				},
			);
		}
		return await videoResponse.blob();
	}
}

export class TogetherTextToVideoTask extends TogetherVideoTask implements TextToVideoTaskHelper {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...normalizeTogetherVideoParameters(params.args.parameters as Record<string, unknown> | undefined),
			prompt: params.args.inputs,
			model: params.model,
		};
	}
}

export class TogetherImageToVideoTask extends TogetherVideoTask implements ImageToVideoTaskHelper {
	override preparePayload(params: BodyParams<ImageToVideoArgs>): Record<string, unknown> {
		const rawParameters = (params.args.parameters as Record<string, unknown> | undefined) ?? {};
		const { prompt, ...rest } = rawParameters as { prompt?: string } & Record<string, unknown>;
		const normalized = normalizeTogetherVideoParameters(rest);
		const payload: Record<string, unknown> = {
			...omit(params.args, ["inputs", "parameters"]),
			...normalized,
			// Together expects each keyframe as { input_image: <base64>, frame: "first" | "last" }
			// for i2v models. See https://docs.together.ai/docs/inference/videos/reference-and-keyframes
			frame_images: [{ input_image: params.args.inputs, frame: "first" }],
			model: params.model,
		};
		if (typeof prompt === "string") {
			payload.prompt = prompt;
		}
		return payload;
	}

	async preparePayloadAsync(args: ImageToVideoArgs): Promise<RequestArgs> {
		const { inputs, ...restArgs } = args;
		if (!(inputs instanceof Blob)) {
			throw new InferenceClientInputError("Together image-to-video expects a Blob input.");
		}
		// Together's i2v models accept the image as a data URL or as an HTTP(S) URL in
		// `frame_images[].input_image`, but cap the field at ~60KB. Larger images will
		// be rejected with "Range of input length should be [1, 61440]" — users with
		// big inputs should host the image and pass parameters.frame_images directly.
		const imageDataUrl = await dataUrlFromBlob(inputs, inputs.type || "image/png");
		return {
			...restArgs,
			inputs: imageDataUrl,
		};
	}
}

export class TogetherFeatureExtractionTask extends TaskProviderHelper implements FeatureExtractionTaskHelper {
	constructor() {
		super("together", TOGETHER_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/embeddings";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown> | undefined),
			input: params.args.inputs,
			model: params.model,
		};
	}

	async getResponse(response: TogetherEmbeddingsResponse): Promise<FeatureExtractionOutput> {
		if (
			typeof response === "object" &&
			response !== null &&
			"data" in response &&
			Array.isArray(response.data) &&
			response.data.every(
				(item): item is TogetherEmbeddingsResponse["data"][number] =>
					typeof item === "object" && !!item && Array.isArray(item.embedding),
			)
		) {
			return response.data.map((item) => item.embedding);
		}
		throw new InferenceClientProviderOutputError(
			`Received malformed response from Together feature-extraction (embeddings) API: ${JSON.stringify(response)}`,
		);
	}
}

export class TogetherTextToSpeechTask extends TaskProviderHelper implements TextToSpeechTaskHelper {
	constructor() {
		super("together", TOGETHER_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/audio/speech";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		const userParams = (params.args.parameters as Record<string, unknown> | undefined) ?? {};
		// Together's /v1/audio/speech requires a `voice` field. Voices are model-specific
		// (Kokoro accepts `af_*`, Orpheus uses different names, etc.), so we only default
		// when the target model is Kokoro — the only TTS model currently registered.
		const isKokoro = params.model.toLowerCase().includes("kokoro");
		const voice = userParams.voice ?? (isKokoro ? "af_alloy" : undefined);

		return {
			...omit(params.args, ["inputs", "parameters"]),
			...userParams,
			...(voice !== undefined ? { voice } : {}),
			input: params.args.inputs,
			model: params.model,
		};
	}

	async getResponse(response: Blob): Promise<Blob> {
		if (response instanceof Blob) {
			return response;
		}
		throw new InferenceClientProviderOutputError(
			`Received malformed response from Together text-to-speech API: ${JSON.stringify(response)}`,
		);
	}
}

export class TogetherAutomaticSpeechRecognitionTask
	extends TaskProviderHelper
	implements AutomaticSpeechRecognitionTaskHelper
{
	constructor() {
		super("together", TOGETHER_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/audio/transcriptions";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters", "data"]),
			...(params.args.parameters as Record<string, unknown> | undefined),
			model: params.model,
		};
	}

	override makeBody(params: BodyParams): BodyInit {
		const audio = params.args.data;
		const formData = new FormData();
		if (audio instanceof Blob) {
			formData.append("file", audio, `audio.${mimeTypeToExtension(audio.type)}`);
		} else if (typeof audio === "string") {
			// Together's transcriptions endpoint also accepts a public HTTP(S) URL as the
			// `file` form field (see https://docs.together.ai/docs/speech-to-text).
			formData.append("file", audio);
		} else {
			throw new InferenceClientInputError(
				"Together automatic-speech-recognition expects a Blob, ArrayBuffer, or HTTP(S) URL string audio input.",
			);
		}

		const fields = this.preparePayload(params);
		for (const [key, value] of Object.entries(fields)) {
			if (value === undefined || value === null) continue;
			if (typeof value === "string") {
				formData.append(key, value);
			} else if (typeof value === "number" || typeof value === "boolean") {
				formData.append(key, String(value));
			} else {
				formData.append(key, JSON.stringify(value));
			}
		}

		return formData;
	}

	async preparePayloadAsync(args: AutomaticSpeechRecognitionArgs): Promise<RequestArgs> {
		const audio: unknown = "data" in args ? args.data : args.inputs;
		let data: Blob | string;
		if (audio instanceof Blob) {
			data = audio;
		} else if (audio instanceof ArrayBuffer) {
			data = new Blob([audio]);
		} else if (typeof audio === "string" && /^https?:\/\//.test(audio)) {
			// Pass HTTP(S) URLs through as a string; makeBody will append them to the
			// `file` form field instead of uploading bytes.
			data = audio;
		} else {
			throw new InferenceClientInputError(
				"Together automatic-speech-recognition expects a Blob, ArrayBuffer, or HTTP(S) URL string audio input.",
			);
		}

		// `data` is typed as `Blob | ArrayBuffer` in RequestArgs; URL-string is a
		// Together-specific extension carried through to makeBody.
		return {
			...("data" in args ? omit(args, "data") : omit(args, "inputs")),
			data,
		} as RequestArgs;
	}

	async getResponse(response: TogetherAudioTranscriptionResponse): Promise<AutomaticSpeechRecognitionOutput> {
		if (typeof response === "object" && response !== null && typeof response.text === "string") {
			const out: AutomaticSpeechRecognitionOutput = { text: response.text };
			if (Array.isArray(response.segments)) {
				out.chunks = response.segments.map((seg) => ({
					text: seg.text,
					timestamp: [seg.start, seg.end],
				}));
			}
			return out;
		}
		throw new InferenceClientProviderOutputError(
			`Received malformed response from Together automatic-speech-recognition API: ${JSON.stringify(response)}`,
		);
	}
}
