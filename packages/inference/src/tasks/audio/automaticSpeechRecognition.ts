import type { AutomaticSpeechRecognitionInput, AutomaticSpeechRecognitionOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import type { LegacyAudioInput } from "./utils";

export type AutomaticSpeechRecognitionArgs = BaseArgs & (AutomaticSpeechRecognitionInput | LegacyAudioInput);
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
		task: "automatic-speech-recognition",
	});
	const isValidOutput = typeof res?.text === "string";
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected {text: string}");
	}
	return res;
}
