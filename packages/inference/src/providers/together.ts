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
import type { BodyParams, HeaderParams, OutputType, RequestArgs } from "../types.js";
import { omit } from "../utils/omit.js";
import {
	BaseConversationalTask,
	BaseTextGenerationTask,
	TaskProviderHelper,
	type AutomaticSpeechRecognitionTaskHelper,
	type FeatureExtractionTaskHelper,
	type TextToImageTaskHelper,
	type TextToSpeechTaskHelper,
} from "./providerHelper.js";
import { InferenceClientInputError, InferenceClientProviderOutputError } from "../errors.js";
import type { ChatCompletionInput } from "../../../tasks/dist/commonjs/index.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";

const TOGETHER_API_BASE_URL = "https://api.together.xyz";

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
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
			response_format: params.outputType === "url" ? "url" : "base64",
			model: params.model,
		};
	}

	async getResponse(
		response: TogetherImageGeneration,
		url?: string,
		headers?: HeadersInit,
		outputType?: OutputType,
	): Promise<string | Blob | Record<string, unknown>> {
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
				return fetch(`data:image/jpeg;base64,${base64Data}`).then((res) => res.blob());
			}
		}

		throw new InferenceClientProviderOutputError("Received malformed response from Together text-to-image API");
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
			"Received malformed response from Together feature-extraction (embeddings) API",
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
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown> | undefined),
			input: params.args.inputs,
			model: params.model,
		};
	}

	async getResponse(response: Blob): Promise<Blob> {
		if (response instanceof Blob) {
			return response;
		}
		throw new InferenceClientProviderOutputError("Received malformed response from Together text-to-speech API");
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

	override prepareHeaders(params: HeaderParams, binary: boolean): Record<string, string> {
		void binary;
		// Don't set Content-Type so fetch can populate the multipart boundary automatically.
		const headers: Record<string, string> = {};
		if (params.authMethod !== "none") {
			headers["Authorization"] = `Bearer ${params.accessToken}`;
		}
		return headers;
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
		if (!(audio instanceof Blob)) {
			throw new InferenceClientInputError(
				"Together automatic-speech-recognition expects a Blob (or ArrayBuffer) audio input.",
			);
		}

		const formData = new FormData();
		const ext = audio.type?.split("/")[1] ?? "wav";
		formData.append("file", audio, `audio.${ext}`);

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
		let blob: Blob;
		if (audio instanceof Blob) {
			blob = audio;
		} else if (audio instanceof ArrayBuffer) {
			blob = new Blob([audio]);
		} else {
			throw new InferenceClientInputError(
				"Together automatic-speech-recognition expects a Blob or ArrayBuffer audio input.",
			);
		}

		return {
			...("data" in args ? omit(args, "data") : omit(args, "inputs")),
			data: blob,
		};
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
			"Received malformed response from Together automatic-speech-recognition API",
		);
	}
}
