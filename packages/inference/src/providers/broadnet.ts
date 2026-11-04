/**
 * See the registered mapping of HF model ID => BroadNet model ID here:
 *
 * https://huggingface.co/api/partners/broadnet/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at BroadNet and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to BroadNet, please open an issue on the present repo
 * and we will tag BroadNet team members.
 *
 * Thanks!
 */
import type { AutomaticSpeechRecognitionOutput } from "@huggingface/tasks";
import { InferenceClientInputError, InferenceClientProviderOutputError } from "../errors.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";
import type { BodyParams, RequestArgs } from "../types.js";
import { omit } from "../utils/omit.js";
import {
	type AutomaticSpeechRecognitionTaskHelper,
	BaseConversationalTask,
	TaskProviderHelper,
} from "./providerHelper.js";

/**
 * BroadNet's gateway is OpenAI-compatible; Hugging Face traffic enters under the /hf prefix, which
 * also serves the pricing catalogue at /hf/v1/models and adds the Inference-Id header used for billing.
 */
const BROADNET_API_BASE_URL = "https://inference.broadnet.ai/hf";

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

interface BroadNetTranscriptionResponse {
	text: string;
	segments?: Array<{ start: number; end: number; text: string }>;
}

export class BroadNetConversationalTask extends BaseConversationalTask {
	constructor() {
		super("broadnet", BROADNET_API_BASE_URL);
	}
}

/**
 * automatic-speech-recognition -> OpenAI-style `POST /v1/audio/transcriptions` (multipart).
 * `parameters.return_timestamps` is translated to `response_format: "verbose_json"`, whose
 * `segments` come back as HF `chunks`.
 */
export class BroadNetAutomaticSpeechRecognitionTask
	extends TaskProviderHelper
	implements AutomaticSpeechRecognitionTaskHelper
{
	constructor() {
		super("broadnet", BROADNET_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/audio/transcriptions";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		const parameters = (params.args.parameters ?? {}) as Record<string, unknown>;
		const { return_timestamps, generation_parameters, ...rest } = parameters;
		return {
			...omit(params.args, ["inputs", "parameters", "data"]),
			...rest,
			...(generation_parameters && typeof generation_parameters === "object"
				? (generation_parameters as Record<string, unknown>)
				: {}),
			...(return_timestamps ? { response_format: "verbose_json" } : {}),
			model: params.model,
		};
	}

	override makeBody(params: BodyParams): BodyInit {
		const audio = params.args.data;
		const formData = new FormData();
		if (audio instanceof Blob) {
			formData.append("file", audio, `audio.${mimeTypeToExtension(audio.type)}`);
		} else {
			throw new InferenceClientInputError("BroadNet automatic-speech-recognition expects a Blob audio input.");
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
				"BroadNet automatic-speech-recognition expects a Blob or ArrayBuffer audio input.",
			);
		}

		return {
			...("data" in args ? omit(args, "data") : omit(args, "inputs")),
			data,
		} as RequestArgs;
	}

	async getResponse(response: BroadNetTranscriptionResponse): Promise<AutomaticSpeechRecognitionOutput> {
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
			`Received malformed response from BroadNet automatic-speech-recognition API: ${JSON.stringify(response)}`,
		);
	}
}
