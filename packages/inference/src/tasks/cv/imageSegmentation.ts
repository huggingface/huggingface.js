import type { ImageSegmentationArgs, ImageSegmentationReturn, Options } from "../../types";
import { request } from "../custom/request";

/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50-panoptic
 */
export async function imageSegmentation(
	args: ImageSegmentationArgs,
	options?: Options
): Promise<ImageSegmentationReturn> {
	const res = await request<ImageSegmentationReturn>(args, options);
	const isValidOutput =
		Array.isArray(res) &&
		res.every((x) => typeof x.label === "string" && typeof x.mask === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new TypeError(
			"Invalid inference output: output must be of type Array<label: string, mask: string, score: number>"
		);
	}
	return res;
}
