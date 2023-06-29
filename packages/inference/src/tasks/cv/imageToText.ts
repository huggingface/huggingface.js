import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type ImageToTextArgs = BaseArgs & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageToTextOutput {
	/**
	 * The generated caption
	 */
	generated_text: string;
}

/**
 * This task reads some image input and outputs the text caption.
 */
export async function imageToText(args: ImageToTextArgs, options?: Options): Promise<ImageToTextOutput> {
	const res = (
		await request<[ImageToTextOutput]>(args, {
			...options,
			taskHint: "image-to-text",
		})
	)?.[0];

	if (typeof res?.generated_text !== "string") {
		throw new InferenceOutputError("Expected {generated_text: string}");
	}

	return res;
}
