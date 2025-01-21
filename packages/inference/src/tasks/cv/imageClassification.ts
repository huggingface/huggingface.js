import type { ImageClassificationInput, ImageClassificationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
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
	const payload = preparePayload(args);
	const res = await request<ImageClassificationOutput>(payload, {
		...options,
		taskHint: "image-classification",
	});
	const isValidOutput =
		Array.isArray(res) && res.every((x) => typeof x.label === "string" && typeof x.score === "number");
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Array<{label: string, score: number}>");
	}
	return res;
}
