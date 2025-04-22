import type { ImageSegmentationInput, ImageSegmentationOutput } from "@huggingface/tasks";
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
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "image-segmentation");
	const payload = preparePayload(args);
	const { data: res } = await innerRequest<ImageSegmentationOutput>(payload, providerHelper, {
		...options,
		task: "image-segmentation",
	});
	return providerHelper.getResponse(res);
}
