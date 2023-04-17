import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type ImageToTextArgs = BaseArgs & {
	/**
	 * Binary image data
	 */
	data: Blob | ArrayBuffer;
};

export interface ImageToTextReturn {
	/**
	 * The generated caption
	 */
	generated_text: string;
}

/**
 * This task reads some image input and outputs the text caption.
 */
export async function imageToText(args: ImageToTextArgs, options?: Options): Promise<ImageToTextReturn> {
	return (await request<[ImageToTextReturn]>(args, options))?.[0];
}
