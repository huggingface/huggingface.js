import { resolveProvider } from "../../lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import { makeRequestOptions } from "../../lib/makeRequestOptions.js";
import type { BaseArgs, Options } from "../../types.js";
import { innerRequest } from "../../utils/request.js";
import type { LegacyAudioInput } from "./utils.js";

export type AudioToAudioArgs = BaseArgs &
	(
		| {
				/**
				 * Binary audio data
				 */
				inputs: Blob;
		  }
		| LegacyAudioInput
	);

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
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "audio-to-audio");
	const payload = await providerHelper.preparePayloadAsync(args);
	const { data: res } = await innerRequest<AudioToAudioOutput>(payload, providerHelper, {
		...options,
		task: "audio-to-audio",
	});
	const { url, info } = await makeRequestOptions(args, providerHelper, { ...options, task: "audio-to-audio" });
	return providerHelper.getResponse(res, url, info.headers as Record<string, string>, undefined, options?.signal);
}
