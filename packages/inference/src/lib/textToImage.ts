import type { Options, TextToImageArgs, TextToImageReturn } from "../types";
import { request } from "./request";

/**
 * This task reads some text input and outputs an image.
 * Recommended model: stabilityai/stable-diffusion-2
 */
export async function textToImage(args: TextToImageArgs, options?: Options): Promise<TextToImageReturn> {
	const res = await request<TextToImageReturn>(args, options);
	const isValidOutput = res && res instanceof Blob;
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type object & of instance Blob");
	}
	return res;
}
