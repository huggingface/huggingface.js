import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options, RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
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
	if (args.provider === "fal-ai") {
		const contentType = args.data instanceof Blob ? args.data.type : "audio/mpeg";
		const base64audio = base64FromBytes(
			new Uint8Array(args.data instanceof ArrayBuffer ? args.data : await args.data.arrayBuffer())
		);
		(args as RequestArgs & { audio_url: string }).audio_url = `data:${contentType};base64,${base64audio}`;
		delete (args as RequestArgs & { data: unknown }).data;
	}
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
