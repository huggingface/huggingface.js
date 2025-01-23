import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import type { LegacyAudioInput } from "./utils";
import { preparePayload } from "./utils";

export type AudioToAudioArgs =
	| (BaseArgs & {
			/**
			 * Binary audio data
			 */
			inputs: Blob;
	  })
	| LegacyAudioInput;

export interface AudioToAudioOutputElem {
	/**
	 * The label for the audio output (model specific)
	 */
	label: string;

	/**
	 * Base64 encoded audio output.
	 */
	audio: Blob;
}

export interface AudioToAudioOutput {
	blob: string;
	"content-type": string;
	label: string;
}

/**
 * This task reads some audio input and outputs one or multiple audio files.
 * Example model: speechbrain/sepformer-wham does audio source separation.
 */
export async function audioToAudio(args: AudioToAudioArgs, options?: Options): Promise<AudioToAudioOutput[]> {
	const payload = preparePayload(args);
	const res = await request<AudioToAudioOutput>(payload, {
		...options,
		taskHint: "audio-to-audio",
	});

	return validateOutput(res);
}

function validateOutput(output: unknown): AudioToAudioOutput[] {
	if (!Array.isArray(output)) {
		throw new InferenceOutputError("Expected Array");
	}
	if (
		!output.every((elem): elem is AudioToAudioOutput => {
			return (
				typeof elem === "object" &&
				elem &&
				"label" in elem &&
				typeof elem.label === "string" &&
				"content-type" in elem &&
				typeof elem["content-type"] === "string" &&
				"blob" in elem &&
				typeof elem.blob === "string"
			);
		})
	) {
		throw new InferenceOutputError("Expected Array<{label: string, audio: Blob}>");
	}
	return output;
}
