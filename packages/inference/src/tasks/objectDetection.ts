import { request } from "./request";
import type { ObjectDetectionArgs, ObjectDetectionReturn, Options } from "../types";

/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50
 */
export async function objectDetection(args: ObjectDetectionArgs, options?: Options): Promise<ObjectDetectionReturn> {
	const res = await request<ObjectDetectionReturn>(args, options);
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
		throw new TypeError(
			"Invalid inference output: output must be of type Array<{label:string; score:number; box:{xmin:number; ymin:number; xmax:number; ymax:number}}>"
		);
	}
	return res;
}
