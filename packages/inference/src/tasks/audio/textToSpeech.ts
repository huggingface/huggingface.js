import type { TextToSpeechInput, TextToSpeechOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

type TextToSpeechArgs = BaseArgs & TextToSpeechInput;

/**
 * This task synthesize an audio of a voice pronouncing a given text.
 * Recommended model: espnet/kan-bayashi_ljspeech_vits
 */
export async function textToSpeech(args: TextToSpeechArgs, options?: Options): Promise<TextToSpeechOutput> {
	const res = await request<TextToSpeechOutput>(args, {
		...options,
		taskHint: "text-to-speech",
	});
	const isValidOutput = res && res instanceof Blob;
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Blob");
	}
	return res;
}
