import type { AutomaticSpeechRecognitionInput, AutomaticSpeechRecognitionOutput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import { FAL_AI_SUPPORTED_BLOB_TYPES } from "../../providers/fal-ai";
import type { BaseArgs, Options, RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
import { omit } from "../../utils/omit";
import { innerRequest } from "../../utils/request";
import type { LegacyAudioInput } from "./utils";
import { preparePayload } from "./utils";

export type AutomaticSpeechRecognitionArgs = BaseArgs & (AutomaticSpeechRecognitionInput | LegacyAudioInput);
/**
 * This task reads some audio input and outputs the said words within the audio files.
 * Recommended model (english language): facebook/wav2vec2-large-960h-lv60-self
 */
export async function automaticSpeechRecognition(
	args: AutomaticSpeechRecognitionArgs,
	options?: Options
): Promise<AutomaticSpeechRecognitionOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "automatic-speech-recognition");
	const payload = await buildPayload(args);
	const { data: res } = await innerRequest<AutomaticSpeechRecognitionOutput>(payload, providerHelper, {
		...options,
		task: "automatic-speech-recognition",
	});
	const isValidOutput = typeof res?.text === "string";
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected {text: string}");
	}
	return providerHelper.getResponse(res);
}

async function buildPayload(args: AutomaticSpeechRecognitionArgs): Promise<RequestArgs> {
	if (args.provider === "fal-ai") {
		const blob = "data" in args && args.data instanceof Blob ? args.data : "inputs" in args ? args.inputs : undefined;
		const contentType = blob?.type;
		if (!contentType) {
			throw new Error(
				`Unable to determine the input's content-type. Make sure your are passing a Blob when using provider fal-ai.`
			);
		}
		if (!FAL_AI_SUPPORTED_BLOB_TYPES.includes(contentType)) {
			throw new Error(
				`Provider fal-ai does not support blob type ${contentType} - supported content types are: ${FAL_AI_SUPPORTED_BLOB_TYPES.join(
					", "
				)}`
			);
		}
		const base64audio = base64FromBytes(new Uint8Array(await blob.arrayBuffer()));
		return {
			...("data" in args ? omit(args, "data") : omit(args, "inputs")),
			audio_url: `data:${contentType};base64,${base64audio}`,
		};
	} else {
		return preparePayload(args);
	}
}
