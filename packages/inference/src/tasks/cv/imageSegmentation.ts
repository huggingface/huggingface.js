import type { ImageSegmentationInput, ImageSegmentationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import { omit } from "../../utils/omit";

export type ImageSegmentationArgs = BaseArgs & ImageSegmentationInput;

/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50-panoptic
 */
export async function imageSegmentation(
	args: ImageSegmentationArgs,
	options?: Options
): Promise<ImageSegmentationOutput> {
	const payload = {
		...omit(args, "inputs"),
		data: args.inputs,
	};
	const res = await request<ImageSegmentationOutput>(payload, {
		...options,
		taskHint: "image-segmentation",
	});
	const isValidOutput =
		Array.isArray(res) &&
		res.every((x) => typeof x.label === "string" && typeof x.mask === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{label: string, mask: string, score: number}>");
	}
	return res;
}
