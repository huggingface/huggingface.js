import type { ImageToImageInput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type ImageToImageArgs = BaseArgs & ImageToImageInput;

/**
 * This task reads some text input and outputs an image.
 * Recommended model: lllyasviel/sd-controlnet-depth
 */
export async function imageToImage(args: ImageToImageArgs, options?: Options): Promise<Blob> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "image-to-image");
	const payload = await providerHelper.preparePayloadAsync(args);
	const { data: res } = await innerRequest<Blob>(payload, providerHelper, {
		...options,
		task: "image-to-image",
	});
	return providerHelper.getResponse(res);
}
