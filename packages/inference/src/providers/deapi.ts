/**
 * See the registered mapping of HF model ID => deAPI model ID here:
 *
 * https://huggingface.co/api/partners/deapi/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_INFERENCE_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at deAPI and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to deAPI, please open an issue on the present repo
 * and we will tag deAPI team members.
 *
 * Thanks!
 *
 * deAPI exposes an OpenAI-compatible API (https://docs.deapi.ai/openai-compatibility). The base URL is
 * "https://oai.deapi.ai" and each task maps to a standard OpenAI route (v1/images/generations,
 * v1/images/edits, v1/embeddings, v1/audio/speech, v1/audio/transcriptions). The implementation closely
 * mirrors the Together provider, which targets the same OpenAI-compatible surface.
 */
import type { AutomaticSpeechRecognitionOutput, FeatureExtractionOutput } from "@huggingface/tasks";
import type { BodyParams, OutputType, RequestArgs } from "../types.js";
import { omit } from "../utils/omit.js";
import { InferenceClientInputError, InferenceClientProviderOutputError } from "../errors.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";
import type { ImageToImageArgs } from "../tasks/cv/imageToImage.js";
import {
	TaskProviderHelper,
	type AutomaticSpeechRecognitionTaskHelper,
	type FeatureExtractionTaskHelper,
	type ImageToImageTaskHelper,
	type TextToImageTaskHelper,
	type TextToSpeechTaskHelper,
} from "./providerHelper.js";

// NOTE: no trailing "/v1" — makeUrl appends the route (e.g. "v1/images/generations").
const DEAPI_BASE_URL = "https://oai.deapi.ai";

// deAPI ASR (Whisper) accepts audio up to 20 MB (https://docs.deapi.ai/limits-and-quotas).
const DEAPI_ASR_MAX_BYTES = 20 * 1024 * 1024;

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
	if (!mimeType) {
		return "wav";
	}
	return AUDIO_MIME_TO_EXT[mimeType.toLowerCase()] ?? "wav";
}

/** Derive a file extension from an image MIME type (e.g. "image/png;..." => "png"). */
function imageMimeToExtension(mimeType: string | undefined): string {
	const subtype = (mimeType ?? "").split(";")[0].split("/")[1];
	return subtype || "png";
}

/** Append a flat record of fields to a FormData, JSON-encoding non-primitive values. */
function appendFieldsToFormData(formData: FormData, fields: Record<string, unknown>): void {
	for (const [key, value] of Object.entries(fields)) {
		if (value === undefined || value === null) {
			continue;
		}
		if (typeof value === "string") {
			formData.append(key, value);
		} else if (typeof value === "number" || typeof value === "boolean") {
			formData.append(key, String(value));
		} else {
			formData.append(key, JSON.stringify(value));
		}
	}
}

interface DeapiImageGenerationOutput {
	data: Array<{
		b64_json?: string;
		url?: string;
	}>;
}

interface DeapiEmbeddingsResponse {
	data: Array<{
		embedding: number[];
		index: number;
		object: string;
	}>;
	model: string;
	object: string;
}

interface DeapiAutomaticSpeechRecognitionOutput {
	text: string;
}

/**
 * text-to-image => POST v1/images/generations
 *
 * deAPI returns `{ data: [{ url }] }` (and may also return `b64_json` when
 * `response_format=b64_json` is requested), matching the OpenAI image API shape.
 */
export class DeapiTextToImageTask extends TaskProviderHelper implements TextToImageTaskHelper {
	constructor() {
		super("deapi", DEAPI_BASE_URL);
	}

	makeRoute(): string {
		return "v1/images/generations";
	}

	/** Task label used in malformed-response errors. Overridden by subclasses. */
	protected get imageTaskLabel(): string {
		return "text-to-image";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown> | undefined),
			prompt: params.args.inputs,
			// When the caller wants raw bytes we ask deAPI for base64 to avoid a second
			// round-trip fetch; for "url" output we keep the hosted URL.
			response_format: params.outputType === "url" ? "url" : "b64_json",
			model: params.model,
		};
	}

	async getResponse(
		response: DeapiImageGenerationOutput,
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
				const imageUrl = response.data[0].url;
				if (outputType === "url") {
					return imageUrl;
				}
				const imgResponse = await fetch(imageUrl, { signal });
				return await imgResponse.blob();
			}
			if ("b64_json" in response.data[0] && typeof response.data[0].b64_json === "string") {
				const base64Data = response.data[0].b64_json;
				if (outputType === "dataUrl") {
					return `data:image/jpeg;base64,${base64Data}`;
				}
				return fetch(`data:image/jpeg;base64,${base64Data}`, { signal }).then((res) => res.blob());
			}
		}
		throw new InferenceClientProviderOutputError(`Received malformed response from deAPI ${this.imageTaskLabel} API`);
	}
}

/**
 * image-to-image => POST v1/images/edits  (multipart/form-data)
 *
 * deAPI does NOT support inpainting, so a `mask` input is rejected client-side (it would
 * otherwise 400 server-side). The image is uploaded as a form field; we never set
 * Content-Type manually so the runtime adds the multipart boundary.
 */
export class DeapiImageToImageTask extends DeapiTextToImageTask implements ImageToImageTaskHelper {
	protected override get imageTaskLabel(): string {
		return "image-to-image";
	}

	override makeRoute(): string {
		return "v1/images/edits";
	}

	/** Non-file fields appended to the FormData in makeBody. */
	override preparePayload(params: BodyParams<ImageToImageArgs>): Record<string, unknown> {
		const parameters = (params.args.parameters as Record<string, unknown> | undefined) ?? {};
		if (parameters.mask !== undefined || parameters.mask_image !== undefined) {
			throw new InferenceClientInputError("deAPI image-to-image does not support inpainting (mask is not supported).");
		}
		const { prompt, ...restParameters } = parameters as { prompt?: string } & Record<string, unknown>;
		return {
			...omit(params.args, ["inputs", "parameters", "data"]),
			...restParameters,
			prompt: prompt ?? "",
			model: params.model,
		};
	}

	override makeBody(params: BodyParams): BodyInit {
		const image = params.args.data;
		if (!(image instanceof Blob)) {
			throw new InferenceClientInputError("deAPI image-to-image expects a Blob image input.");
		}
		const formData = new FormData();
		formData.append("image", image, `image.${imageMimeToExtension(image.type)}`);
		appendFieldsToFormData(formData, this.preparePayload(params as BodyParams<ImageToImageArgs>));
		return formData;
	}

	async preparePayloadAsync(args: ImageToImageArgs): Promise<RequestArgs> {
		if (!(args.inputs instanceof Blob)) {
			throw new InferenceClientInputError("deAPI image-to-image expects a Blob image input.");
		}
		// Carry the image through as binary `data`; makeBody assembles the multipart body.
		return {
			...omit(args, "inputs"),
			data: args.inputs,
		} as RequestArgs;
	}

	// Response shape is identical to text-to-image ({ data: [{ url | b64_json }] }); reuse the
	// inherited parser and narrow the return type to Blob as required by ImageToImageTaskHelper.
	override async getResponse(
		response: DeapiImageGenerationOutput,
		url?: string,
		headers?: HeadersInit,
		outputType?: OutputType,
		signal?: AbortSignal,
	): Promise<Blob> {
		const result = await super.getResponse(response, url, headers, outputType, signal);
		if (result instanceof Blob) {
			return result;
		}
		throw new InferenceClientProviderOutputError(`Received malformed response from deAPI ${this.imageTaskLabel} API`);
	}
}

/**
 * feature-extraction => POST v1/embeddings  (OpenAI-compatible; modeled on Together/Nebius)
 *
 * BAAI/bge-m3 => Bge_M3_FP16 ; embedding dim 1024, input max 2048 tokens.
 */
export class DeapiFeatureExtractionTask extends TaskProviderHelper implements FeatureExtractionTaskHelper {
	constructor() {
		super("deapi", DEAPI_BASE_URL);
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

	async getResponse(response: DeapiEmbeddingsResponse): Promise<FeatureExtractionOutput> {
		if (
			typeof response === "object" &&
			response !== null &&
			"data" in response &&
			Array.isArray(response.data) &&
			response.data.every(
				(item): item is DeapiEmbeddingsResponse["data"][number] =>
					typeof item === "object" && !!item && Array.isArray(item.embedding),
			)
		) {
			return response.data.map((item) => item.embedding);
		}
		throw new InferenceClientProviderOutputError(
			`Received malformed response from deAPI feature-extraction (embeddings) API: ${JSON.stringify(response)}`,
		);
	}
}

/**
 * text-to-speech => POST v1/audio/speech  (returns raw audio bytes)
 *
 * deAPI supports mp3/wav/flac/opus output formats. The Kokoro model requires a `voice`.
 */
export class DeapiTextToSpeechTask extends TaskProviderHelper implements TextToSpeechTaskHelper {
	constructor() {
		super("deapi", DEAPI_BASE_URL);
	}

	makeRoute(): string {
		return "v1/audio/speech";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		const userParams = (params.args.parameters as Record<string, unknown> | undefined) ?? {};
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...userParams,
			input: params.args.inputs,
			model: params.model,
		};
	}

	async getResponse(response: Blob): Promise<Blob> {
		if (response instanceof Blob) {
			return response;
		}
		throw new InferenceClientProviderOutputError(
			`Received malformed response from deAPI text-to-speech API: ${JSON.stringify(response)}`,
		);
	}
}

/**
 * automatic-speech-recognition => POST v1/audio/transcriptions  (multipart/form-data)
 *
 * openai/whisper-large-v3 => WhisperLargeV3 ; audio up to 20 MB. We never set Content-Type
 * manually so the runtime adds the multipart boundary.
 */
export class DeapiAutomaticSpeechRecognitionTask
	extends TaskProviderHelper
	implements AutomaticSpeechRecognitionTaskHelper
{
	constructor() {
		super("deapi", DEAPI_BASE_URL);
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
		} else {
			throw new InferenceClientInputError("deAPI automatic-speech-recognition expects a Blob audio input.");
		}
		appendFieldsToFormData(formData, this.preparePayload(params));
		return formData;
	}

	async preparePayloadAsync(args: AutomaticSpeechRecognitionArgs): Promise<RequestArgs> {
		const audio: unknown = "data" in args ? args.data : args.inputs;
		let data: Blob;
		if (audio instanceof Blob) {
			data = audio;
		} else if (audio instanceof ArrayBuffer) {
			data = new Blob([audio]);
		} else {
			throw new InferenceClientInputError(
				"deAPI automatic-speech-recognition expects a Blob or ArrayBuffer audio input.",
			);
		}
		if (data.size > DEAPI_ASR_MAX_BYTES) {
			throw new InferenceClientInputError(
				`deAPI automatic-speech-recognition accepts audio up to ${DEAPI_ASR_MAX_BYTES} bytes (20 MB); got ${data.size} bytes.`,
			);
		}
		return {
			...("data" in args ? omit(args, "data") : omit(args, "inputs")),
			data,
		} as RequestArgs;
	}

	async getResponse(response: DeapiAutomaticSpeechRecognitionOutput): Promise<AutomaticSpeechRecognitionOutput> {
		if (typeof response === "object" && response !== null && typeof response.text === "string") {
			return { text: response.text };
		}
		// deAPI also supports response_format=text, which yields a bare string.
		if (typeof response === "string") {
			return { text: response };
		}
		throw new InferenceClientProviderOutputError(
			`Received malformed response from deAPI automatic-speech-recognition API: ${JSON.stringify(response)}`,
		);
	}
}
