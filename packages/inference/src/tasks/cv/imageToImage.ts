import type { ImageToImageInput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options, RequestArgs } from "../../types";
import { base64FromBytes } from "../../utils/base64FromBytes";
import { innerRequest } from "../../utils/request";

export type ImageToImageArgs = BaseArgs & ImageToImageInput;

/**
 * This task reads some text input and outputs an image.
 * Recommended model: lllyasviel/sd-controlnet-depth
 */
export async function imageToImage(args: ImageToImageArgs, options?: Options): Promise<Blob> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "image-to-image");
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
	const { data: res } = await innerRequest<Blob>(reqArgs, {
		...options,
		task: "image-to-image",
	});
	return providerHelper.getResponse(res);
}
