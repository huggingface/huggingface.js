/**
 * See the registered mapping of HF model ID => LambdaQ model ID here:
 *
 * https://huggingface.co/api/partners/lambdaq/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at LambdaQ and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to LambdaQ, please open an issue on the present repo
 * and we will tag LambdaQ team members.
 *
 * Thanks!
 */

import type { FeatureExtractionOutput, TextGenerationOutput, TextToImageInput } from "@huggingface/tasks";
import { InferenceClientInputError, InferenceClientProviderOutputError } from "../errors.js";
import type { BodyParams, OutputType } from "../types.js";
import { dataUrlFromBlob } from "../utils/dataUrlFromBlob.js";
import { omit } from "../utils/omit.js";
import {
	BaseConversationalTask,
	BaseTextGenerationTask,
	TaskProviderHelper,
	type FeatureExtractionTaskHelper,
	type TextToImageTaskHelper,
	type TextToSpeechTaskHelper,
} from "./providerHelper.js";

/**
 * LambdaQ serves every task through OpenAI-compatible routes under /v1.
 */
const LAMBDAQ_API_BASE_URL = "https://api.lambdaq.org";

interface LambdaQCompletionResponse {
	choices: Array<{ text?: string }>;
	model: string;
}

interface LambdaQEmbeddingsResponse {
	data: Array<{
		embedding: number[];
		index: number;
		object: string;
	}>;
	model: string;
	object: string;
}

interface LambdaQImageGeneration {
	data: Array<{
		b64_json?: string;
		url?: string | null;
	}>;
}

/**
 * The image format from the base64 payload itself.
 *
 * LambdaQ resells several image models and returns whatever its upstream produced, so the
 * container is not fixed: labelling a PNG as `image/jpeg` in a data URL is the kind of thing
 * that renders fine in a browser and then breaks whoever saves the bytes to disk.
 */
function mimeTypeFromBase64(base64: string): string {
	if (base64.startsWith("iVBORw0KGgo")) {
		return "image/png";
	}
	if (base64.startsWith("UklGR")) {
		return "image/webp";
	}
	if (base64.startsWith("R0lGOD")) {
		return "image/gif";
	}
	return "image/jpeg";
}

export class LambdaQConversationalTask extends BaseConversationalTask {
	constructor() {
		super("lambdaq", LAMBDAQ_API_BASE_URL);
	}
}

export class LambdaQTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("lambdaq", LAMBDAQ_API_BASE_URL);
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		const parameters = (params.args.parameters ?? {}) as Record<string, unknown>;
		const { max_new_tokens: topLevelMaxNewTokens, ...args } = omit(params.args, ["inputs", "parameters"]);
		const { max_new_tokens: nestedMaxNewTokens, ...rest } = parameters;
		// `max_new_tokens` is accepted in both places because callers pass it in both places,
		// and an OpenAI-shaped route silently ignores the name: the request does not fail, it
		// generates to the context limit and is billed for every token of it.
		const maxNewTokens = nestedMaxNewTokens ?? topLevelMaxNewTokens;
		return {
			...args,
			...rest,
			...(maxNewTokens !== undefined ? { max_tokens: maxNewTokens } : undefined),
			prompt: params.args.inputs,
			// `model` is applied last so caller parameters cannot override the mapped provider model.
			model: params.model,
		};
	}

	override async getResponse(response: LambdaQCompletionResponse): Promise<TextGenerationOutput> {
		if (
			typeof response === "object" &&
			response !== null &&
			Array.isArray(response.choices) &&
			response.choices.length > 0 &&
			typeof response.choices[0].text === "string"
		) {
			return { generated_text: response.choices[0].text };
		}

		throw new InferenceClientProviderOutputError(
			"Received malformed response from LambdaQ text-generation API: expected OpenAI completion payload",
		);
	}
}

export class LambdaQFeatureExtractionTask extends TaskProviderHelper implements FeatureExtractionTaskHelper {
	constructor() {
		super("lambdaq", LAMBDAQ_API_BASE_URL);
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

	async getResponse(response: LambdaQEmbeddingsResponse): Promise<FeatureExtractionOutput> {
		if (
			typeof response === "object" &&
			response !== null &&
			Array.isArray(response.data) &&
			response.data.every(
				(item): item is LambdaQEmbeddingsResponse["data"][number] =>
					typeof item === "object" && !!item && Array.isArray(item.embedding),
			)
		) {
			return response.data.map((item) => item.embedding);
		}
		throw new InferenceClientProviderOutputError(
			`Received malformed response from LambdaQ feature-extraction (embeddings) API: ${JSON.stringify(response)}`,
		);
	}
}

export class LambdaQTextToImageTask extends TaskProviderHelper implements TextToImageTaskHelper {
	constructor() {
		super("lambdaq", LAMBDAQ_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/images/generations";
	}

	preparePayload(params: BodyParams<TextToImageInput>): Record<string, unknown> {
		if (params.outputType === "url") {
			// Checked before the request rather than after: images are billed per image, so
			// discovering here that the caller wanted a URL costs nothing, and discovering it in
			// getResponse would cost a generation.
			throw new InferenceClientInputError(
				"lambdaq provider does not support URL output. Use outputType 'blob', 'dataUrl' or 'json' instead.",
			);
		}
		const { width, height, ...parameters } = (params.args.parameters ?? {}) as Record<string, unknown>;
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...parameters,
			// The route is OpenAI-shaped, where the output size is one `size` string. A model
			// that is handed `width`/`height` instead does not fail: it silently returns its
			// default resolution, which on a per-image price is a wasted generation.
			...(typeof width === "number" && typeof height === "number" ? { size: `${width}x${height}` } : undefined),
			prompt: params.args.inputs,
			model: params.model,
		};
	}

	async getResponse(
		response: LambdaQImageGeneration,
		url?: string,
		headers?: HeadersInit,
		outputType?: OutputType,
		signal?: AbortSignal,
	): Promise<string | Blob | Record<string, unknown>> {
		if (typeof response === "object" && response !== null && Array.isArray(response.data) && response.data.length > 0) {
			if (outputType === "json") {
				return { ...response };
			}
			const image = response.data[0];
			if (typeof image.b64_json === "string" && image.b64_json.length > 0) {
				const dataUrl = `data:${mimeTypeFromBase64(image.b64_json)};base64,${image.b64_json}`;
				if (outputType === "dataUrl") {
					return dataUrl;
				}
				return fetch(dataUrl, { signal }).then((res) => res.blob());
			}
			/// Some upstreams hand back a link to the generated image instead of the bytes.
			if (typeof image.url === "string" && image.url.length > 0) {
				const blob = await fetch(image.url, { signal }).then((res) => res.blob());
				return outputType === "dataUrl" ? dataUrlFromBlob(blob, blob.type || "image/jpeg") : blob;
			}
		}

		throw new InferenceClientProviderOutputError("Received malformed response from LambdaQ text-to-image API");
	}
}

export class LambdaQTextToSpeechTask extends TaskProviderHelper implements TextToSpeechTaskHelper {
	constructor() {
		super("lambdaq", LAMBDAQ_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/audio/speech";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		// `voice` is model-specific and optional; it is passed through untouched so the API
		// can surface a clear error for a model that requires one.
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
		throw new InferenceClientProviderOutputError(
			`Received malformed response from LambdaQ text-to-speech API: ${JSON.stringify(response)}`,
		);
	}
}
