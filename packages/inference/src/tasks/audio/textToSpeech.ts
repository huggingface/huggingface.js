import type { TextToSpeechInput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

type TextToSpeechArgs = BaseArgs & TextToSpeechInput;

interface OutputUrlTextToSpeechGeneration {
	output: string | string[];
}
/**
 * This task synthesize an audio of a voice pronouncing a given text.
 * Recommended model: espnet/kan-bayashi_ljspeech_vits
 */
export async function textToSpeech(args: TextToSpeechArgs, options?: Options): Promise<Blob> {
	const res = await request<Blob | OutputUrlTextToSpeechGeneration>(args, {
		...options,
		taskHint: "text-to-speech",
	});
	if (res instanceof Blob) {
		return res;
	}
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
	throw new InferenceOutputError("Expected Blob or object with output");
}
