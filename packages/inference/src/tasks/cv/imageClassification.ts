import { validateOutput, z } from "../../lib/validateOutput";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type ImageClassificationArgs = BaseArgs & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageClassificationOutputValue {
	/**
	 * The label for the class (model specific)
	 */
	label: string;
	/**
	 * A float that represents how likely it is that the image file belongs to this class.
	 */
	score: number;
}

export type ImageClassificationOutput = ImageClassificationOutputValue[];

/**
 * This task reads some image input and outputs the likelihood of classes.
 * Recommended model: google/vit-base-patch16-224
 */
export async function imageClassification(
	args: ImageClassificationArgs,
	options?: Options
): Promise<ImageClassificationOutput> {
	const res = await request<ImageClassificationOutput>(args, {
		...options,
		taskHint: "image-classification",
	});
	return validateOutput(res, z.array(z.object({ label: z.string(), score: z.number() })));
}
