import type { ImageToImageInput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options, RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
import { request } from "../custom/request";

export type ImageToImageArgs = BaseArgs & ImageToImageInput;

/**
 * This task reads some text input and outputs an image.
 * Recommended model: lllyasviel/sd-controlnet-depth
 */
export async function imageToImage(args: ImageToImageArgs, options?: Options): Promise<Blob> {
	let reqArgs: RequestArgs;
	if (!args.parameters) {
		reqArgs = {
			accessToken: args.accessToken,
			model: args.model,
			data: args.inputs,
		};
	} else {
		reqArgs = {
			...args,
			inputs: base64FromBytes(
				new Uint8Array(args.inputs instanceof ArrayBuffer ? args.inputs : await args.inputs.arrayBuffer())
			),
		};
	}
	const res = await request<Blob>(reqArgs, {
		...options,
		taskHint: "image-to-image",
	});
	const isValidOutput = res && res instanceof Blob;
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Blob");
	}
	return res;
}
