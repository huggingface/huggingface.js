import type { ImageToTextArgs, ImageToTextReturn, Options } from "../../types";
import { request } from "../custom/request";

/**
 * This task reads some image input and outputs the text caption.
 */
export async function imageToText(args: ImageToTextArgs, options?: Options): Promise<ImageToTextReturn> {
	return (await request<[ImageToTextReturn]>(args, options))?.[0];
}
