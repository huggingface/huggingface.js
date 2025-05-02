import type { TextToVideoInput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import { makeRequestOptions } from "../../lib/makeRequestOptions";
import type { FalAiQueueOutput } from "../../providers/fal-ai";
import type { NovitaOutput } from "../../providers/novita";
import type { ReplicateOutput } from "../../providers/replicate";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type TextToVideoArgs = BaseArgs & TextToVideoInput;

export type TextToVideoOutput = Blob;

export async function textToVideo(args: TextToVideoArgs, options?: Options): Promise<TextToVideoOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "text-to-video");
	const { data: response } = await innerRequest<FalAiQueueOutput | ReplicateOutput | NovitaOutput>(
		args,
		providerHelper,
		{
			...options,
			task: "text-to-video",
		}
	);
	const { url, info } = await makeRequestOptions(args, providerHelper, { ...options, task: "text-to-video" });
	return providerHelper.getResponse(response, url, info.headers as Record<string, string>);
}
