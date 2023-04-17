import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type AutomaticSpeechRecognitionArgs = BaseArgs & {
	/**
	 * Binary audio data
	 */
	data: Blob | ArrayBuffer;
};

export interface AutomaticSpeechRecognitionReturn {
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
): Promise<AutomaticSpeechRecognitionReturn> {
	const res = await request<AutomaticSpeechRecognitionReturn>(args, options);
	const isValidOutput = typeof res.text === "string";
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type <text: string>");
	}
	return res;
}
