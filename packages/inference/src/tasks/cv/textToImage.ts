import type { TextToImageInput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import { makeRequestOptions } from "../../lib/makeRequestOptions";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type TextToImageArgs = BaseArgs & TextToImageInput;

interface TextToImageOptions extends Options {
	outputType?: "url" | "blob";
}

/**
 * This task reads some text input and outputs an image.
 * Recommended model: stabilityai/stable-diffusion-2
 */
export async function textToImage(
	args: TextToImageArgs,
	options?: TextToImageOptions & { outputType: "url" }
): Promise<string>;
export async function textToImage(
	args: TextToImageArgs,
	options?: TextToImageOptions & { outputType?: undefined | "blob" }
): Promise<Blob>;
export async function textToImage(args: TextToImageArgs, options?: TextToImageOptions): Promise<Blob | string> {
	const provider = args.provider ?? "hf-inference";
	const providerHelper = getProviderHelper(provider, "text-to-image");
	const { data: res } = await innerRequest<Record<string, unknown>>(args, {
		...options,
		task: "text-to-image",
	});

	const { url, info } = await makeRequestOptions(args, { ...options, task: "text-to-image" });
	return providerHelper.getResponse(res, url, info.headers as Record<string, string>, options?.outputType);
}
