import type { ImageClassificationInput, ImageClassificationOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";
import { preparePayload, type LegacyImageInput } from "./utils";

export type ImageClassificationArgs = BaseArgs & (ImageClassificationInput | LegacyImageInput);

/**
 * This task reads some image input and outputs the likelihood of classes.
 * Recommended model: google/vit-base-patch16-224
 */
export async function imageClassification(
	args: ImageClassificationArgs,
	options?: Options
): Promise<ImageClassificationOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "image-classification");
	const payload = preparePayload(args);
	const { data: res } = await innerRequest<ImageClassificationOutput>(payload, providerHelper, {
		...options,
		task: "image-classification",
	});
	return providerHelper.getResponse(res);
}
