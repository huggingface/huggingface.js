import { validateOutput, z } from "../../lib/validateOutput";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type ImageSegmentationArgs = BaseArgs & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageSegmentationOutputValue {
	/**
	 * The label for the class (model specific) of a segment.
	 */
	label: string;
	/**
	 * A str (base64 str of a single channel black-and-white img) representing the mask of a segment.
	 */
	mask: string;
	/**
	 * A float that represents how likely it is that the detected object belongs to the given class.
	 */
	score: number;
}

export type ImageSegmentationOutput = ImageSegmentationOutputValue[];

/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50-panoptic
 */
export async function imageSegmentation(
	args: ImageSegmentationArgs,
	options?: Options
): Promise<ImageSegmentationOutput> {
	const res = await request<ImageSegmentationOutput>(args, {
		...options,
		taskHint: "image-segmentation",
	});
	return validateOutput(res, z.array(z.object({ label: z.string(), mask: z.string(), score: z.number() })));
}
