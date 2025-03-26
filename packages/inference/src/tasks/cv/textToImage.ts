import type { TextToImageInput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

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
	if (!args.provider) {
		throw new Error("Provider is required");
	}

	const providerHelper = getProviderHelper(args.provider, "text-to-image");
	const res = await request<Record<string, unknown>>(args, {
		...options,
		task: "text-to-image",
	});

	// @ts-expect-error - Provider-specific implementations accept the outputType parameter
	return providerHelper.getResponse(res, undefined, undefined, options?.outputType);
}
