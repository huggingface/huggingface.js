import type { VideoToVideoInput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import type { BaseArgs, Options } from "../../types.js";
import { innerRequest } from "../../utils/request.js";
import { makeRequestOptions } from "../../lib/makeRequestOptions.js";

export type VideoToVideoArgs = BaseArgs & VideoToVideoInput;

/**
 * This task takes an input video and transforms it into another video (e.g. upscaling, restyling, editing).
 * Recommended model: Wan-AI/Wan2.2-Animate-14B
 */
export async function videoToVideo(args: VideoToVideoArgs, options?: Options): Promise<Blob> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "video-to-video");
	const payload = await providerHelper.preparePayloadAsync(args);
	const { data: res } = await innerRequest<Blob>(payload, providerHelper, {
		...options,
		task: "video-to-video",
	});
	const { url, info } = await makeRequestOptions(args, providerHelper, { ...options, task: "video-to-video" });
	return providerHelper.getResponse(res, url, info.headers as Record<string, string>, undefined, options?.signal);
}
