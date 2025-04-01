import { request } from "../custom/request";
import type { BaseArgs, Options } from "../../types";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { ObjectDetectionInput, ObjectDetectionOutput } from "@huggingface/tasks";
import { preparePayload, type LegacyImageInput } from "./utils";

export type ObjectDetectionArgs = BaseArgs & (ObjectDetectionInput | LegacyImageInput);

/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50
 */
export async function objectDetection(args: ObjectDetectionArgs, options?: Options): Promise<ObjectDetectionOutput> {
	const payload = preparePayload(args);
	const res = await request<ObjectDetectionOutput>(payload, {
		...options,
		task: "object-detection",
	});
	const isValidOutput =
		Array.isArray(res) &&
		res.every(
			(x) =>
				typeof x.label === "string" &&
				typeof x.score === "number" &&
				typeof x.box.xmin === "number" &&
				typeof x.box.ymin === "number" &&
				typeof x.box.xmax === "number" &&
				typeof x.box.ymax === "number"
		);
	if (!isValidOutput) {
		throw new InferenceOutputError(
			"Expected Array<{label:string; score:number; box:{xmin:number; ymin:number; xmax:number; ymax:number}}>"
		);
	}
	return res;
}
