import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type AudioToAudioArgs = BaseArgs & {
	/**
	 * Binary audio data
	 */
	data: Blob | ArrayBuffer;
};

export interface AudioToAudioOutputValue {
	/**
	 * The label for the audio output (model specific)
	 */
	label: string;

	/**
	 * Base64 encoded audio output.
	 */
	blob: string;

	/**
	 * Content-type for blob, e.g. audio/flac
	 */
	"content-type": string;
}

export type AudioToAudioReturn = AudioToAudioOutputValue[];

/**
 * This task reads some audio input and outputs one or multiple audio files.
 * Example model: speechbrain/sepformer-wham does audio source separation.
 */
export async function audioToAudio(args: AudioToAudioArgs, options?: Options): Promise<AudioToAudioReturn> {
	const res = await request<AudioToAudioReturn>(args, {
		...options,
		taskHint: "audio-to-audio",
	});
	const isValidOutput =
		Array.isArray(res) &&
		res.every(
			(x) => typeof x.label === "string" && typeof x.blob === "string" && typeof x["content-type"] === "string"
		);
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{label: string, blob: string, content-type: string}>");
	}
	return res;
}
