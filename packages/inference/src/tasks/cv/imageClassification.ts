import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type ImageClassificationArgs = BaseArgs & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageClassificationReturnValue {
	/**
	 * A float that represents how likely it is that the image file belongs to this class.
	 */
	label: string;
	/**
	 * The label for the class (model specific)
	 */
	score: number;
}

export type ImageClassificationReturn = ImageClassificationReturnValue[];

/**
 * This task reads some image input and outputs the likelihood of classes.
 * Recommended model: google/vit-base-patch16-224
 */
export async function imageClassification(
	args: ImageClassificationArgs,
	options?: Options
): Promise<ImageClassificationReturn> {
	const res = await request<ImageClassificationReturn>(args, options);
	const isValidOutput =
		Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<label: string, score: number>");
	}
	return res;
}
