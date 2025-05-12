import type { ImageSegmentationInput, ImageSegmentationOutput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";
import { preparePayload, type LegacyImageInput } from "./utils";

export type ImageSegmentationArgs = BaseArgs & (ImageSegmentationInput | LegacyImageInput);

/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50-panoptic
 */
export async function imageSegmentation(
	args: ImageSegmentationArgs,
	options?: Options
): Promise<ImageSegmentationOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "image-segmentation");
	const payload = preparePayload(args);
	const { data: res } = await innerRequest<ImageSegmentationOutput>(payload, providerHelper, {
		...options,
		task: "image-segmentation",
	});
	return providerHelper.getResponse(res);
}
