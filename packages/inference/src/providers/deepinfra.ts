/**
 * See the registered mapping of HF model ID => DeepInfra model ID here:
 *
 * https://huggingface.co/api/partners/deepinfra/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before
 it's registered on huggingface.co,
* you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in
consts.ts, for dev purposes.
*
* - If you work at DeepInfra and want to update this mapping, please
use the model mapping API we provide on huggingface.co
* - If you're a community member and want to add a new supported HF
model to DeepInfra, please open an issue on the present repo
* and we will tag DeepInfra team members.
*
* Thanks!
*/

import type { AutomaticSpeechRecognitionOutput, TextGenerationOutput } from "@huggingface/tasks";
import { InferenceClientInputError, InferenceClientProviderOutputError } from "../errors.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";
import type { BodyParams, RequestArgs } from "../types.js";
import { omit } from "../utils/omit.js";
import {
	type AutomaticSpeechRecognitionTaskHelper,
	BaseConversationalTask,
	BaseTextGenerationTask,
	TaskProviderHelper,
} from "./providerHelper.js";

/**
 * DeepInfra exposes OpenAI-compatible endpoints under the /v1/openai namespace.
 */
const DEEPINFRA_API_BASE_URL = "https://api.deepinfra.com";

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
	// Strip MIME parameters (e.g. `audio/webm;codecs=opus`) before lookup.
	const baseType = mimeType.split(";")[0].trim().toLowerCase();
	return AUDIO_MIME_TO_EXT[baseType] ?? "wav";
}

interface DeepInfraCompletionChoice {
	text?: string;
}

interface DeepInfraCompletionResponse {
	choices: DeepInfraCompletionChoice[];
	model: string;
}

interface DeepInfraAudioTranscriptionSegment {
	start: number;
	end: number;
	text: string;
}

interface DeepInfraAudioTranscriptionResponse {
	text: string;
	segments?: DeepInfraAudioTranscriptionSegment[];
}

export class DeepInfraConversationalTask extends BaseConversationalTask {
	constructor() {
		super("deepinfra", DEEPINFRA_API_BASE_URL);
	}

	override makeRoute(): string {
		return "v1/openai/chat/completions";
	}
}

export class DeepInfraTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("deepinfra", DEEPINFRA_API_BASE_URL);
	}

	override makeRoute(): string {
		return "v1/openai/completions";
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		const parameters = params.args.parameters as Record<string, unknown> | undefined;
		const res = {
			model: params.model,
			prompt: params.args.inputs,
			...omit(params.args, ["inputs", "parameters"]),
			...(parameters
				? {
						max_tokens: parameters.max_new_tokens,
						...omit(parameters, ["max_new_tokens"]),
					}
				: undefined),
		};
		return res;
	}

	override async getResponse(response: DeepInfraCompletionResponse): Promise<TextGenerationOutput> {
		if (
			typeof response === "object" &&
			response !== null &&
			Array.isArray(response.choices) &&
			response.choices.length > 0
		) {
			const completion = response.choices[0].text;
			if (typeof completion === "string") {
				return { generated_text: completion };
			}
		}

		throw new InferenceClientProviderOutputError(
			"Received malformed response from DeepInfra text-generation API: expected OpenAI completion payload",
		);
	}
}

export class DeepInfraAutomaticSpeechRecognitionTask
	extends TaskProviderHelper
	implements AutomaticSpeechRecognitionTaskHelper
{
	constructor() {
		super("deepinfra", DEEPINFRA_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/openai/audio/transcriptions";
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
			throw new InferenceClientInputError("DeepInfra automatic-speech-recognition expects a Blob audio input.");
		}

		const fields = this.preparePayload(params);
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
				"DeepInfra automatic-speech-recognition expects a Blob or ArrayBuffer audio input.",
			);
		}

		return {
			...("data" in args ? omit(args, "data") : omit(args, "inputs")),
			data,
		} as RequestArgs;
	}

	async getResponse(response: DeepInfraAudioTranscriptionResponse): Promise<AutomaticSpeechRecognitionOutput> {
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
			`Received malformed response from DeepInfra automatic-speech-recognition API: ${JSON.stringify(response)}`,
		);
	}
}
