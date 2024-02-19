import { request } from "../custom/request";
import type { BaseArgs, Options } from "../../types";
import { validateOutput, z } from "../../lib/validateOutput";

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

	return validateOutput(
		res,
		z.array(
			z.object({
				label: z.string(),
				score: z.number(),
				box: z.object({ xmin: z.number(), ymin: z.number(), xmax: z.number(), ymax: z.number() }),
			})
		)
	);
}
