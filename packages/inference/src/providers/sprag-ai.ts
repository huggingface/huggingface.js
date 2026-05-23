/**
 * See the registered mapping of HF model ID => Sprag model ID here:
 *
 * https://huggingface.co/api/partners/sprag-ai/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Sprag and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Sprag, please open an issue on the present repo
 * and we will tag Sprag team members.
 *
 * Thanks!
 */
import { InferenceClientProviderOutputError } from "../errors.js";
import type { BodyParams } from "../types.js";
import { BaseConversationalTask, TaskProviderHelper, type TextToSpeechTaskHelper } from "./providerHelper.js";

const SPRAG_API_BASE_URL = "https://api.sprag.ai";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export class SpragAIConversationalTask extends BaseConversationalTask {
	constructor() {
		super("sprag-ai", SPRAG_API_BASE_URL);
	}
}

export class SpragAITextToSpeechTask extends TaskProviderHelper implements TextToSpeechTaskHelper {
	constructor() {
		super("sprag-ai", SPRAG_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/audio/speech";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		const parameters = isRecord(params.args.parameters) ? params.args.parameters : {};
		const generationParameters = isRecord(parameters.generation_parameters) ? parameters.generation_parameters : {};
		// stream_format is dropped: the HF inference client has no streaming TTS entry point,
		// so an SSE response would be read as a Blob of raw event text instead of audio.
		const { stream_format: _streamFormat, ...passthroughParameters } = generationParameters;
		void _streamFormat;

		return {
			...passthroughParameters,
			input: params.args.inputs,
			model: params.model,
		};
	}

	async getResponse(response: Blob): Promise<Blob> {
		if (response instanceof Blob) {
			return response;
		}
		throw new InferenceClientProviderOutputError(
			`Received malformed response from Sprag text-to-speech API: expected Blob, got ${JSON.stringify(response)}`,
		);
	}
}
