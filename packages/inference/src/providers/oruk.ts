import type { AutomaticSpeechRecognitionOutput } from "@huggingface/tasks";
import { InferenceClientInputError, InferenceClientProviderOutputError } from "../errors.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";
import type { BodyParams, HeaderParams, RequestArgs, UrlParams } from "../types.js";
import { omit } from "../utils/omit.js";
import { type AutomaticSpeechRecognitionTaskHelper, TaskProviderHelper } from "./providerHelper.js";

/** Candidate provider identifier; HF server-side registration is still required. */
export class OrukAutomaticSpeechRecognitionTask
	extends TaskProviderHelper
	implements AutomaticSpeechRecognitionTaskHelper
{
	constructor() {
		super("oruk", "https://qwen3-asr.oruk.ai");
	}

	makeRoute(params: UrlParams): string {
		return `models/${params.model.split("/").map(encodeURIComponent).join("/")}`;
	}

	override prepareHeaders(params: HeaderParams, isBinary: boolean): Record<string, string> {
		return { ...super.prepareHeaders(params, isBinary), "Content-Type": "application/octet-stream" };
	}

	preparePayload(): Record<string, unknown> {
		return {};
	}

	override makeBody(params: BodyParams): BodyInit {
		if (!(params.args.data instanceof Blob)) {
			throw new InferenceClientInputError("Oruk automatic-speech-recognition expects a Blob audio input.");
		}
		return params.args.data;
	}

	async preparePayloadAsync(args: AutomaticSpeechRecognitionArgs): Promise<RequestArgs> {
		const parameters = "parameters" in args ? args.parameters : undefined;
		if (
			parameters !== undefined &&
			(Object.keys(parameters).some((key) => key !== "return_timestamps") ||
				(parameters.return_timestamps !== undefined && parameters.return_timestamps !== false))
		) {
			throw new InferenceClientInputError(
				"Oruk ASR currently supports text transcription only, without timestamps or generation parameters.",
			);
		}
		const audio: unknown = "data" in args ? args.data : args.inputs;
		let data: Blob;
		if (audio instanceof Blob) {
			data = audio;
		} else if (audio instanceof ArrayBuffer) {
			data = new Blob([audio]);
		} else {
			throw new InferenceClientInputError(
				"Oruk automatic-speech-recognition expects a Blob or ArrayBuffer audio input; URLs are not accepted.",
			);
		}
		if (data.size === 0 || data.size > 25 * 1024 * 1024) {
			throw new InferenceClientInputError(
				"Oruk ASR audio must contain 1 byte to 25 MiB; decoded duration is limited to 60 seconds.",
			);
		}
		return { ...("data" in args ? omit(args, "data") : omit(args, ["inputs", "parameters"])), data } as RequestArgs;
	}

	async getResponse(response: unknown): Promise<AutomaticSpeechRecognitionOutput> {
		if (typeof response === "object" && response !== null && "text" in response && typeof response.text === "string") {
			return { text: response.text };
		}
		throw new InferenceClientProviderOutputError("Received malformed response from Oruk ASR: expected a text string.");
	}
}
