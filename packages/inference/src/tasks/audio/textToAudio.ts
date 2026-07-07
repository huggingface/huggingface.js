import type { TextToAudioInput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import { makeRequestOptions } from "../../lib/makeRequestOptions.js";
import type { BaseArgs, Options } from "../../types.js";
import { innerRequest } from "../../utils/request.js";

export type TextToAudioArgs = BaseArgs & TextToAudioInput;

interface OutputUrlTextToAudioGeneration {
	output: string | string[];
}

/**
 * This task generates audio (e.g. music or sound effects) from an input text prompt.
 * Example model: stabilityai/stable-audio-open-1.0
 */
export async function textToAudio(args: TextToAudioArgs, options?: Options): Promise<Blob> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "text-to-audio");
	const { data: res } = await innerRequest<Blob | OutputUrlTextToAudioGeneration>(args, providerHelper, {
		...options,
		task: "text-to-audio",
	});
	const { url, info } = await makeRequestOptions(args, providerHelper, { ...options, task: "text-to-audio" });
	return providerHelper.getResponse(res, url, info.headers as Record<string, string>, undefined, options?.signal);
}
