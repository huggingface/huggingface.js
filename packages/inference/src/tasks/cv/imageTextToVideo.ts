import type { ImageTextToVideoInput, ImageTextToVideoParameters } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import type { BaseArgs, Options } from "../../types.js";
import { innerRequest } from "../../utils/request.js";

/**
 * Optional reference inputs, addressed from the prompt by position ("Image 1", "Video 1",
 * "Audio 1"). Each entry is a URL, a data URL, or a `Blob` — a browser `File` picked in a widget can
 * be handed over directly, and the provider helper inlines it.
 *
 * Not part of the task schema: only some providers serve them (today, fal on its reference-to-video
 * endpoints), and the ones that cannot say so rather than ignoring them. Callers use these names
 * regardless of provider, so nothing consuming the task has to know who serves the model.
 */
export type ReferenceInputs = Partial<
	Record<"reference_images" | "reference_videos" | "reference_audio", (string | Blob)[]>
>;

// No `Omit` of the reference keys: both task types carry an index signature, so `keyof` them is
// `string | number` and an Omit would launder every named parameter back into that signature.
export type ImageTextToVideoArgs = BaseArgs &
	ImageTextToVideoInput & {
		parameters?: ImageTextToVideoParameters & ReferenceInputs;
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
