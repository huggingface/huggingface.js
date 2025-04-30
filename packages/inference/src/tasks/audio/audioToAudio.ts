import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";
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
	const model = "inputs" in args ? args.model : undefined;
	const provider = await resolveProvider(args.provider, model);
	const providerHelper = getProviderHelper(provider, "audio-to-audio");
	const payload = preparePayload(args);
	const { data: res } = await innerRequest<AudioToAudioOutput>(payload, providerHelper, {
		...options,
		task: "audio-to-audio",
	});
	return providerHelper.getResponse(res);
}
