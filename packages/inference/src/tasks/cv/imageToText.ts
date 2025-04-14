import type { ImageToTextInput, ImageToTextOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";
import type { LegacyImageInput } from "./utils";
import { preparePayload } from "./utils";

export type ImageToTextArgs = BaseArgs & (ImageToTextInput | LegacyImageInput);
/**
 * This task reads some image input and outputs the text caption.
 */
export async function imageToText(args: ImageToTextArgs, options?: Options): Promise<ImageToTextOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "image-to-text");
	const payload = preparePayload(args);
	const { data: res } = await innerRequest<[ImageToTextOutput]>(payload, providerHelper, {
		...options,
		task: "image-to-text",
	});

	return providerHelper.getResponse(res[0]);
}
