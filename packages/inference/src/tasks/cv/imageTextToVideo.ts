import type { ImageTextToVideoInput, ImageTextToVideoParameters } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import type { BaseArgs, Options } from "../../types.js";
import { innerRequest } from "../../utils/request.js";

/**
 * The task schema types the reference lists as URLs (plain or data URLs), which is what reaches the
 * provider. Callers holding the bytes - a browser `File` picked in a widget, say - can hand them
 * over directly instead, and the provider helper inlines them.
 */
type ReferenceInputs = Partial<Record<"reference_images" | "reference_videos" | "reference_audio", (string | Blob)[]>>;

export type ImageTextToVideoArgs = BaseArgs &
	Omit<ImageTextToVideoInput, "parameters"> & {
		parameters?: Omit<ImageTextToVideoParameters, keyof ReferenceInputs> & ReferenceInputs;
	};

/**
 * This task takes an image and text input and outputs a generated video.
 * Recommended model: Lightricks/LTX-Video
 */
export async function imageTextToVideo(args: ImageTextToVideoArgs, options?: Options): Promise<Blob> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "image-text-to-video");
	const payload = await providerHelper.preparePayloadAsync(args);
	const { data: res, requestContext } = await innerRequest<Blob>(payload, providerHelper, {
		...options,
		task: "image-text-to-video",
	});
	return providerHelper.getResponse(
		res,
		requestContext.url,
		requestContext.info.headers as Record<string, string>,
		undefined,
		options?.signal,
	);
}
