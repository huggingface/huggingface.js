import type { ImageToVideoInput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { FalAiQueueOutput } from "../../providers/fal-ai";
import type { ReplicateOutput } from "../../providers/replicate";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";
import { makeRequestOptions } from "../../lib/makeRequestOptions";

export type ImageToVideoArgs = BaseArgs & ImageToVideoInput;

export type ImageToVideoOutput = Blob;

export async function imageToVideo(args: ImageToVideoArgs, options?: Options): Promise<ImageToVideoOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "image-to-video");
	const { data: response } = await innerRequest<FalAiQueueOutput | ReplicateOutput>(
		args, 
		providerHelper,
		{
			...options,
			task: "image-to-video",
		}
	);
	const { url, info } = await makeRequestOptions(args, providerHelper, { ...options, task: "image-to-video" });
	return providerHelper.getResponse(response, url, info.headers as Record<string, string>);
}
