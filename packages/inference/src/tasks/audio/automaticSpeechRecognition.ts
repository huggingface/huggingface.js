import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type AutomaticSpeechRecognitionArgs = BaseArgs & {
	/**
	 * Binary audio data
	 */
	data: Blob | ArrayBuffer;
};

export interface AutomaticSpeechRecognitionOutput {
	/**
	 * The text that was recognized from the audio
	 */
	text: string;
}

/**
 * This task reads some audio input and outputs the said words within the audio files.
 * Recommended model (english language): facebook/wav2vec2-large-960h-lv60-self
 */
export async function automaticSpeechRecognition(
	args: AutomaticSpeechRecognitionArgs,
	options?: Options
): Promise<AutomaticSpeechRecognitionOutput> {
	const res = await request<AutomaticSpeechRecognitionOutput>(args, {
		...options,
		taskHint: "automatic-speech-recognition",
	});
	const isValidOutput = typeof res?.text === "string";
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected {text: string}");
	}
	return res;
}
