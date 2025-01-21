import type { AutomaticSpeechRecognitionInput, AutomaticSpeechRecognitionOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
import { request } from "../custom/request";
import type { LegacyAudioInput } from "./utils";
import { preparePayload } from "./utils";

export type AutomaticSpeechRecognitionArgs = BaseArgs & (AutomaticSpeechRecognitionInput | LegacyAudioInput);
/**
 * This task reads some audio input and outputs the said words within the audio files.
 * Recommended model (english language): facebook/wav2vec2-large-960h-lv60-self
 */
export async function automaticSpeechRecognition(
	args: AutomaticSpeechRecognitionArgs,
	options?: Options
): Promise<AutomaticSpeechRecognitionOutput> {
	const payload = preparePayload(args);
	if (args.provider === "fal-ai") {
		const contentType = args.inputs.type;
		if (!FAL_AI_SUPPORTED_BLOB_TYPES.includes(contentType)) {
			throw new Error(
				`Provider fal-ai does not support blob type ${contentType} - supported content types are: ${FAL_AI_SUPPORTED_BLOB_TYPES.join(
					", "
				)}`
			);
		}
		const base64audio = base64FromBytes(new Uint8Array(await args.inputs.arrayBuffer()));
		(args as AutomaticSpeechRecognitionArgs & { audio_url: string }).audio_url =
			`data:${contentType};base64,${base64audio}`;
	}
	const res = await request<AutomaticSpeechRecognitionOutput>(payload as AutomaticSpeechRecognitionArgs, {
		...options,
		taskHint: "automatic-speech-recognition",
	});
	const isValidOutput = typeof res?.text === "string";
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected {text: string}");
	}
	return res;
}

const FAL_AI_SUPPORTED_BLOB_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav"];
