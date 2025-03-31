import type { ImageToTextInput, ImageToTextOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";
import type { LegacyImageInput } from "./utils";
import { preparePayload } from "./utils";

export type ImageToTextArgs = BaseArgs & (ImageToTextInput | LegacyImageInput);
/**
 * This task reads some image input and outputs the text caption.
 */
export async function imageToText(args: ImageToTextArgs, options?: Options): Promise<ImageToTextOutput> {
	const payload = preparePayload(args);
	const res = (
		await innerRequest<[ImageToTextOutput]>(payload, {
			...options,
			task: "image-to-text",
		})
	).data?.[0];

	if (typeof res?.generated_text !== "string") {
		throw new InferenceOutputError("Expected {generated_text: string}");
	}

	return res;
}
