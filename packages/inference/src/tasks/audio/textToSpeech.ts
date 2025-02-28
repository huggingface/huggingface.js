import type { TextToSpeechInput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { omit } from "../../utils/omit";
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
	// Replicate models expects "text" instead of "inputs"
	const payload =
		args.provider === "replicate"
			? {
					...omit(args, ["inputs", "parameters"]),
					...args.parameters,
					text: args.inputs,
			  }
			: args;
	const res = await request<Blob | OutputUrlTextToSpeechGeneration>(payload, {
		...options,
		task: "text-to-speech",
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
