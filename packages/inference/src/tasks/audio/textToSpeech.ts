import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TextToSpeechArgs = BaseArgs & {
	/**
	 * The text to generate an audio from
	 */
	inputs: string;
};

export type TextToSpeechOutput = Blob;
interface OutputUrlTextToSpeechGeneration {
	output: string;
}
/**
 * This task synthesize an audio of a voice pronouncing a given text.
 * Recommended model: espnet/kan-bayashi_ljspeech_vits
 */
export async function textToSpeech(args: TextToSpeechArgs, options?: Options): Promise<TextToSpeechOutput> {
	const res = await request<TextToSpeechOutput | OutputUrlTextToSpeechGeneration>(args, {
		...options,
		taskHint: "text-to-speech",
	});
	if (res && typeof res === "object") {
		if ("output" in res) {
			if (typeof res.output === "string") {
				const urlResponse = await fetch(res.output);
				const blob = await urlResponse.blob();
				return blob;
			} else if (Array.isArray(res.output)) {
				const urlResponse = await fetch(res.output[0]);
				const blob = await urlResponse.blob();
				return blob;
			}
		}
	}
	const isValidOutput = res && res instanceof Blob;
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Blob");
	}
	return res;
}
