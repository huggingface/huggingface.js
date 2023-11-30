import { validateOutput, z } from "../../lib/validateOutput";
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
	return validateOutput(
		res,
		z.array(
			z.object({
				label: z.string(),
				blob: z.string(),
				"content-type": z.string(),
			})
		)
	);
}
