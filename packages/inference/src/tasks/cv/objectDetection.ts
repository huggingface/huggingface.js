import { request } from "../custom/request";
import type { BaseArgs, Options } from "../../types";
import { InferenceOutputError } from "../../lib/InferenceOutputError";

export type ObjectDetectionArgs = BaseArgs & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ObjectDetectionOutputValue {
	/**
	 * A dict (with keys [xmin,ymin,xmax,ymax]) representing the bounding box of a detected object.
	 */
	box: {
		xmax: number;
		xmin: number;
		ymax: number;
		ymin: number;
	};
	/**
	 * The label for the class (model specific) of a detected object.
	 */
	label: string;

	/**
	 * A float that represents how likely it is that the detected object belongs to the given class.
	 */
	score: number;
}

export type ObjectDetectionOutput = ObjectDetectionOutputValue[];

/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50
 */
export async function objectDetection(args: ObjectDetectionArgs, options?: Options): Promise<ObjectDetectionOutput> {
	const res = await request<ObjectDetectionOutput>(args, {
		...options,
		taskHint: "object-detection",
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
