import type {
	AudioClassificationInput,
	AudioClassificationOutput,
	AutomaticSpeechRecognitionInput,
	AutomaticSpeechRecognitionOutput,
	ChatCompletionInput,
	ChatCompletionOutput,
	DocumentQuestionAnsweringInput,
	DocumentQuestionAnsweringOutput,
	FeatureExtractionInput,
	FeatureExtractionOutput,
	FillMaskInput,
	FillMaskOutput,
	ImageClassificationInput,
	ImageClassificationOutput,
	ImageSegmentationInput,
	ImageSegmentationOutput,
	ImageToImageInput,
	ImageToTextInput,
	ImageToTextOutput,
	ImageToVideoInput,
	ImageTextToImageInput,
	ImageTextToVideoInput,
	ObjectDetectionInput,
	ObjectDetectionOutput,
	QuestionAnsweringInput,
	QuestionAnsweringOutput,
	SentenceSimilarityInput,
	SentenceSimilarityOutput,
	SummarizationInput,
	SummarizationOutput,
	TableQuestionAnsweringInput,
	TableQuestionAnsweringOutput,
	TextClassificationOutput,
	TextGenerationInput,
	TextGenerationOutput,
	TextToImageInput,
	TextToSpeechInput,
	TextToVideoInput,
	TokenClassificationInput,
	TokenClassificationOutput,
	TranslationInput,
	TranslationOutput,
	VisualQuestionAnsweringInput,
	VisualQuestionAnsweringOutput,
	ZeroShotClassificationInput,
	ZeroShotClassificationOutput,
	ZeroShotImageClassificationInput,
	ZeroShotImageClassificationOutput,
} from "@huggingface/tasks";
import { HF_ROUTER_URL } from "../config.js";
import {
	InferenceClientInputError,
	InferenceClientProviderOutputError,
	InferenceClientRoutingError,
} from "../errors.js";
import type { AudioToAudioArgs, AudioToAudioOutput } from "../tasks/audio/audioToAudio.js";
import type {
	BaseArgs,
	BodyParams,
	HeaderParams,
	InferenceProvider,
	OutputType,
	RequestArgs,
	UrlParams,
} from "../types.js";
import { toArray } from "../utils/toArray.js";
import { dataUrlFromBlob } from "../utils/dataUrlFromBlob.js";
import { omit } from "../utils/omit.js";
import type { ImageToImageArgs } from "../tasks/cv/imageToImage.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";
import type { ImageToVideoArgs } from "../tasks/cv/imageToVideo.js";
import type { ImageTextToImageArgs } from "../tasks/cv/imageTextToImage.js";
import type { ImageTextToVideoArgs } from "../tasks/cv/imageTextToVideo.js";
import type { ImageSegmentationArgs } from "../tasks/cv/imageSegmentation.js";
import type { ImageToTextArgs } from "../tasks/cv/imageToText.js";

/**
 * Base class for task-specific provider helpers
 */
export abstract class TaskProviderHelper {
	constructor(
		readonly provider: InferenceProvider,
		protected baseUrl: string,
		readonly clientSideRoutingOnly: boolean = false,
	) {}

	/**
	 * Return the response in the expected format.
	 * Needs to be implemented in the subclasses.
	 */
	abstract getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: OutputType,
		signal?: AbortSignal,
	): Promise<unknown>;

	/**
	 * Prepare the route for the request
	 * Needs to be implemented in the subclasses.
	 */
	abstract makeRoute(params: UrlParams): string;
	/**
	 * Prepare the payload for the request
	 * Needs to be implemented in the subclasses.
	 */
	abstract preparePayload(params: BodyParams): unknown;

	/**
	 * Prepare the base URL for the request
	 */
	makeBaseUrl(params: UrlParams): string {
		return params.authMethod !== "provider-key" ? `${HF_ROUTER_URL}/${this.provider}` : this.baseUrl;
	}

	/**
	 * Prepare the body for the request
	 */
	makeBody(params: BodyParams): BodyInit {
		if ("data" in params.args && !!params.args.data) {
			return params.args.data as BodyInit;
		}
		return JSON.stringify(this.preparePayload(params));
	}

	/**
	 * Prepare the URL for the request
	 */
	makeUrl(params: UrlParams): string {
		const baseUrl = this.makeBaseUrl(params);
		const route = this.makeRoute(params).replace(/^\/+/, "");
		if (params.urlTransform) {
			return params.urlTransform(`${baseUrl}/${route}`);
		}
		return `${baseUrl}/${route}`;
	}

	/**
	 * Prepare the headers for the request
	 */
	prepareHeaders(params: HeaderParams, isBinary: boolean): Record<string, string> {
		const headers: Record<string, string> = {};
		if (params.authMethod !== "none") {
			headers["Authorization"] = `Bearer ${params.accessToken}`;
		}
		if (!isBinary) {
			headers["Content-Type"] = "application/json";
		}
		return headers;
	}
}

// PER-TASK PROVIDER HELPER INTERFACES

// CV Tasks
export interface TextToImageTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: OutputType,
		signal?: AbortSignal,
	): Promise<string | Blob | Record<string, unknown>>;
	preparePayload(params: BodyParams<TextToImageInput & BaseArgs>): Record<string, unknown>;
}

export interface TextToVideoTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: Record<string, string>,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob>;
	preparePayload(params: BodyParams<TextToVideoInput & BaseArgs>): Record<string, unknown>;
}

export interface ImageToImageTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob>;
	preparePayload(params: BodyParams<ImageToImageInput & BaseArgs>): Record<string, unknown>;
	preparePayloadAsync(args: ImageToImageArgs): Promise<RequestArgs>;
}

export interface ImageToVideoTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob>;
	preparePayload(params: BodyParams<ImageToVideoInput & BaseArgs>): Record<string, unknown>;
	preparePayloadAsync(args: ImageToVideoArgs): Promise<RequestArgs>;
}

export interface ImageTextToImageTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob>;
	preparePayload(params: BodyParams<ImageTextToImageInput & BaseArgs>): Record<string, unknown>;
	preparePayloadAsync(args: ImageTextToImageArgs): Promise<RequestArgs>;
}

export interface ImageTextToVideoTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob>;
	preparePayload(params: BodyParams<ImageTextToVideoInput & BaseArgs>): Record<string, unknown>;
	preparePayloadAsync(args: ImageTextToVideoArgs): Promise<RequestArgs>;
}

/**
 * `image-text-to-video` carries optional reference images, videos and audio clips alongside its
 * prompt, each addressed from the prompt by its position ("Image 1", "Video 1", "Audio 1").
 *
 * Providers agree on the concept and on nothing else: fal wants `reference_image_urls`, wavespeed
 * `reference_images`, and each bounds the lists differently. A provider declares those differences
 * as a {@link ReferenceInputsSpec} and calls {@link buildReferenceInputs}; the reading, validating
 * and inlining is the same everywhere.
 */
export const REFERENCE_MODALITIES = ["images", "videos", "audio"] as const;

export type ReferenceModality = (typeof REFERENCE_MODALITIES)[number];

/** A URL, a data URL, or the bytes themselves. */
export type ReferenceValue = string | Blob | ArrayBuffer;

/** The task parameter each modality arrives in. */
const TASK_FIELDS: Record<ReferenceModality, string> = {
	images: "reference_images",
	videos: "reference_videos",
	audio: "reference_audio",
};

/** Assumed content type when binary arrives without one. */
const FALLBACK_MIME_TYPES: Record<ReferenceModality, string> = {
	images: "image/png",
	videos: "video/mp4",
	audio: "audio/mpeg",
};

export interface ReferenceInputsSpec {
	/** Payload field carrying each modality. */
	fields: Record<ReferenceModality, string>;
	/** Most entries this provider accepts per modality. */
	maxItems?: Partial<Record<ReferenceModality, number>>;
	/** Most entries this provider accepts across all modalities combined. */
	maxTotal?: number;
	/** Reject a call whose only references are audio. */
	rejectAudioAlone?: boolean;
	/** Inline one binary reference. Defaults to a data URL carrying the blob's own content type. */
	encode?: (blob: Blob, modality: ReferenceModality) => Promise<string>;
}

export interface ReferenceInputs {
	/** Non-empty lists only, under the provider's own field names. */
	payload: Record<string, string[]>;
	/** How many entries each modality carried, before naming. */
	counts: Record<ReferenceModality, number>;
	/** Entries across every modality. */
	total: number;
}

function asList(value: unknown): ReferenceValue[] {
	return value === undefined || value === null ? [] : toArray(value as ReferenceValue | ReferenceValue[]);
}

async function inline(value: ReferenceValue, modality: ReferenceModality, spec: ReferenceInputsSpec): Promise<string> {
	if (typeof value === "string") {
		return value;
	}
	const fallback = FALLBACK_MIME_TYPES[modality];
	const blob = value instanceof Blob ? value : new Blob([value], { type: fallback });
	return spec.encode ? spec.encode(blob, modality) : dataUrlFromBlob(blob, blob.type || fallback);
}

/**
 * Reads the task's reference parameters, checks them against what the provider accepts, and returns
 * them inlined under the provider's field names.
 *
 * @param leadingImage prepended to the images list — for providers whose primary image is simply the
 * first subject reference, rather than a separate first-frame field.
 */
export async function buildReferenceInputs(options: {
	provider: string;
	parameters: Record<string, unknown> | undefined;
	spec: ReferenceInputsSpec;
	leadingImage?: ReferenceValue;
}): Promise<ReferenceInputs> {
	const { provider, parameters, spec, leadingImage } = options;

	const supplied = Object.fromEntries(
		REFERENCE_MODALITIES.map((modality) => [
			modality,
			[
				...(modality === "images" && leadingImage !== undefined ? [leadingImage] : []),
				...asList(parameters?.[TASK_FIELDS[modality]]),
			],
		]),
	) as Record<ReferenceModality, ReferenceValue[]>;

	const counts = Object.fromEntries(
		REFERENCE_MODALITIES.map((modality) => [modality, supplied[modality].length]),
	) as Record<ReferenceModality, number>;
	const total = REFERENCE_MODALITIES.reduce((sum, modality) => sum + counts[modality], 0);

	for (const modality of REFERENCE_MODALITIES) {
		const max = spec.maxItems?.[modality];
		if (max !== undefined && counts[modality] > max) {
			throw new InferenceClientInputError(
				`Provider ${provider} accepts at most ${max} entries in ${TASK_FIELDS[modality]}, got ${counts[modality]}.`,
			);
		}
	}
	if (spec.maxTotal !== undefined && total > spec.maxTotal) {
		throw new InferenceClientInputError(
			`Provider ${provider} accepts at most ${spec.maxTotal} reference files in total, got ${total}.`,
		);
	}
	if (spec.rejectAudioAlone && counts.audio > 0 && counts.images + counts.videos === 0) {
		throw new InferenceClientInputError(
			`Provider ${provider} does not accept reference audio on its own — pass at least one reference image or video with it.`,
		);
	}

	const payload: Record<string, string[]> = {};
	for (const modality of REFERENCE_MODALITIES) {
		if (counts[modality]) {
			payload[spec.fields[modality]] = await Promise.all(
				supplied[modality].map((value) => inline(value, modality, spec)),
			);
		}
	}
	return { payload, counts, total };
}

/** The task parameters consumed by {@link buildReferenceInputs}, for callers stripping them. */
export const REFERENCE_PARAMETERS = Object.values(TASK_FIELDS);

export interface ImageSegmentationTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<ImageSegmentationOutput>;
	preparePayload(params: BodyParams<ImageSegmentationInput & BaseArgs>): Record<string, unknown> | BodyInit;
	preparePayloadAsync(args: ImageSegmentationArgs): Promise<RequestArgs>;
}

export interface ImageClassificationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<ImageClassificationOutput>;
	preparePayload(params: BodyParams<ImageClassificationInput & BaseArgs>): Record<string, unknown> | BodyInit;
}

export interface ObjectDetectionTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<ObjectDetectionOutput>;
	preparePayload(params: BodyParams<ObjectDetectionInput & BaseArgs>): Record<string, unknown> | BodyInit;
}

export interface ImageToTextTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<ImageToTextOutput>;
	preparePayload(params: BodyParams<ImageToTextInput & BaseArgs>): Record<string, unknown> | BodyInit;
	preparePayloadAsync(args: ImageToTextArgs, signal?: AbortSignal): Promise<RequestArgs>;
}

export interface ZeroShotImageClassificationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<ZeroShotImageClassificationOutput>;
	preparePayload(params: BodyParams<ZeroShotImageClassificationInput & BaseArgs>): Record<string, unknown> | BodyInit;
}

// NLP Tasks
export interface TextGenerationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<TextGenerationOutput>;
	preparePayload(params: BodyParams<TextGenerationInput & BaseArgs>): Record<string, unknown>;
}

export interface ConversationalTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<ChatCompletionOutput>;
	preparePayload(params: BodyParams<ChatCompletionInput & BaseArgs>): Record<string, unknown>;
}

export interface TextClassificationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<TextClassificationOutput>;
	preparePayload(params: BodyParams<ZeroShotClassificationInput & BaseArgs>): Record<string, unknown>;
}

export interface QuestionAnsweringTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<QuestionAnsweringOutput[number]>;
	preparePayload(params: BodyParams<QuestionAnsweringInput & BaseArgs>): Record<string, unknown>;
}

export interface FillMaskTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<FillMaskOutput>;
	preparePayload(params: BodyParams<FillMaskInput & BaseArgs>): Record<string, unknown>;
}

export interface ZeroShotClassificationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<ZeroShotClassificationOutput>;
	preparePayload(params: BodyParams<ZeroShotClassificationInput & BaseArgs>): Record<string, unknown>;
}

export interface SentenceSimilarityTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<SentenceSimilarityOutput>;
	preparePayload(params: BodyParams<SentenceSimilarityInput & BaseArgs>): Record<string, unknown>;
}

export interface TableQuestionAnsweringTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<TableQuestionAnsweringOutput[number]>;
	preparePayload(params: BodyParams<TableQuestionAnsweringInput & BaseArgs>): Record<string, unknown>;
}

export interface TokenClassificationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<TokenClassificationOutput>;
	preparePayload(params: BodyParams<TokenClassificationInput & BaseArgs>): Record<string, unknown>;
}

export interface TranslationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<TranslationOutput>;
	preparePayload(params: BodyParams<TranslationInput & BaseArgs>): Record<string, unknown>;
}

export interface SummarizationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<SummarizationOutput>;
	preparePayload(params: BodyParams<SummarizationInput & BaseArgs>): Record<string, unknown>;
}

// Audio Tasks
export interface TextToSpeechTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob>;
	preparePayload(params: BodyParams<TextToSpeechInput & BaseArgs>): Record<string, unknown>;
}

export interface TextToAudioTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<Blob>;
	preparePayload(params: BodyParams<Record<string, unknown> & BaseArgs>): Record<string, unknown>;
}

export interface AudioToAudioTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<AudioToAudioOutput[]>;
	preparePayload(
		params: BodyParams<BaseArgs & { inputs: Blob } & Record<string, unknown>>,
	): Record<string, unknown> | BodyInit;
	preparePayloadAsync(args: AudioToAudioArgs): Promise<RequestArgs>;
}
export interface AutomaticSpeechRecognitionTaskHelper {
	getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: undefined,
		signal?: AbortSignal,
	): Promise<AutomaticSpeechRecognitionOutput>;
	preparePayload(params: BodyParams<AutomaticSpeechRecognitionInput & BaseArgs>): Record<string, unknown> | BodyInit;
	preparePayloadAsync(args: AutomaticSpeechRecognitionArgs): Promise<RequestArgs>;
}

export interface AudioClassificationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<AudioClassificationOutput>;
	preparePayload(params: BodyParams<AudioClassificationInput & BaseArgs>): Record<string, unknown> | BodyInit;
}

// Multimodal Tasks
export interface DocumentQuestionAnsweringTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<DocumentQuestionAnsweringOutput[number]>;
	preparePayload(params: BodyParams<DocumentQuestionAnsweringInput & BaseArgs>): Record<string, unknown> | BodyInit;
}

export interface FeatureExtractionTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<FeatureExtractionOutput>;
	preparePayload(params: BodyParams<FeatureExtractionInput & BaseArgs>): Record<string, unknown>;
}

export interface VisualQuestionAnsweringTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<VisualQuestionAnsweringOutput[number]>;
	preparePayload(params: BodyParams<VisualQuestionAnsweringInput & BaseArgs>): Record<string, unknown> | BodyInit;
}

export interface TabularClassificationTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<number[]>;
	preparePayload(
		params: BodyParams<BaseArgs & { inputs: { data: Record<string, string[]> } } & Record<string, unknown>>,
	): Record<string, unknown> | BodyInit;
}

export interface TabularRegressionTaskHelper {
	getResponse(response: unknown, url?: string, headers?: HeadersInit): Promise<number[]>;
	preparePayload(
		params: BodyParams<BaseArgs & { inputs: { data: Record<string, string[]> } } & Record<string, unknown>>,
	): Record<string, unknown> | BodyInit;
}

// BASE IMPLEMENTATIONS FOR COMMON PATTERNS

export class BaseConversationalTask extends TaskProviderHelper implements ConversationalTaskHelper {
	constructor(provider: InferenceProvider, baseUrl: string, clientSideRoutingOnly: boolean = false) {
		super(provider, baseUrl, clientSideRoutingOnly);
	}

	makeRoute(): string {
		return "v1/chat/completions";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		/// `model` is serialized first so that a router/proxy can resolve the target provider from a
		/// small prefix of the request body instead of buffering the whole payload — `messages` can
		/// hold megabytes of base64-encoded images.
		/// `params.args` also carries the caller-supplied `model` (possibly with a `:provider` routing
		/// suffix), which must not take precedence over the resolved provider model id: omit it.
		return {
			model: params.model,
			...omit(params.args, "model"),
		};
	}

	async getResponse(response: ChatCompletionOutput): Promise<ChatCompletionOutput> {
		if (
			typeof response === "object" &&
			Array.isArray(response?.choices) &&
			typeof response?.created === "number" &&
			typeof response?.id === "string" &&
			typeof response?.model === "string" &&
			/// Some providers (e.g. Together.ai) do not output a system_fingerprint
			(response.system_fingerprint === undefined ||
				response.system_fingerprint === null ||
				typeof response.system_fingerprint === "string") &&
			typeof response?.usage === "object"
		) {
			return response;
		}

		throw new InferenceClientProviderOutputError("Expected ChatCompletionOutput");
	}
}

export class BaseTextGenerationTask extends TaskProviderHelper implements TextGenerationTaskHelper {
	constructor(provider: InferenceProvider, baseUrl: string, clientSideRoutingOnly: boolean = false) {
		super(provider, baseUrl, clientSideRoutingOnly);
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...params.args,
			model: params.model,
		};
	}

	makeRoute(): string {
		return "v1/completions";
	}

	async getResponse(response: unknown): Promise<TextGenerationOutput> {
		const res = toArray(response);
		if (
			Array.isArray(res) &&
			res.length > 0 &&
			res.every(
				(x): x is { generated_text: string } =>
					typeof x === "object" && !!x && "generated_text" in x && typeof x.generated_text === "string",
			)
		) {
			return res[0];
		}

		throw new InferenceClientProviderOutputError("Expected Array<{generated_text: string}>");
	}
}

export class AutoRouterConversationalTask extends BaseConversationalTask {
	constructor() {
		super("auto" as InferenceProvider, "https://router.huggingface.co");
	}

	override makeBaseUrl(params: UrlParams): string {
		if (params.authMethod !== "hf-token") {
			throw new InferenceClientRoutingError("Cannot select auto-router when using non-Hugging Face API key.");
		}
		return this.baseUrl;
	}
}
