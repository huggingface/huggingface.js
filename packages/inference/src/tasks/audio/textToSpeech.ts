import { validateOutput, z } from "../../lib/validateOutput";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TextToSpeechArgs = BaseArgs & {
	/**
	 * The text to generate an audio from
	 */
	inputs: string;
};

export type TextToSpeechOutput = Blob;

/**
 * This task synthesize an audio of a voice pronouncing a given text.
 * Recommended model: espnet/kan-bayashi_ljspeech_vits
 */
export async function textToSpeech(args: TextToSpeechArgs, options?: Options): Promise<TextToSpeechOutput> {
	const res = await request<TextToSpeechOutput>(args, {
		...options,
		taskHint: "text-to-speech",
	});
	return validateOutput(res, z.blob());
}
