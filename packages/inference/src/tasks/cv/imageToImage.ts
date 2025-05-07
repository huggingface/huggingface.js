import type { ImageToImageInput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
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
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "image-to-image");
	const payload = await buildPayload(args);
	const { data: res } = await innerRequest<Blob>(payload, providerHelper, {
		...options,
		task: "image-to-image",
	});
	return providerHelper.getResponse(res);
}

async function buildPayload(args: ImageToImageArgs): Promise<RequestArgs> {
	if (args.provider === "hf-inference") {
		if (!args.parameters) {
			return {
				accessToken: args.accessToken,
				model: args.model,
				data: args.inputs,
			};
		} else {
			return {
				...args,
				inputs: base64FromBytes(
					new Uint8Array(args.inputs instanceof ArrayBuffer ? args.inputs : await args.inputs.arrayBuffer())
				),
			};
		}
	} else {
		return args;
	}
}
