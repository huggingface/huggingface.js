import type { TextToSpeechInput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";
type TextToSpeechArgs = BaseArgs & TextToSpeechInput;

interface OutputUrlTextToSpeechGeneration {
	output: string | string[];
}
/**
 * This task synthesize an audio of a voice pronouncing a given text.
 * Recommended model: espnet/kan-bayashi_ljspeech_vits
 */
export async function textToSpeech(args: TextToSpeechArgs, options?: Options): Promise<Blob> {
	const provider = args.provider ?? "hf-inference";
	const providerHelper = getProviderHelper(provider, "text-to-speech");
	const { data: res } = await innerRequest<Blob | OutputUrlTextToSpeechGeneration>(args, {
		...options,
		task: "text-to-speech",
	});
	return providerHelper.getResponse(res);
}
