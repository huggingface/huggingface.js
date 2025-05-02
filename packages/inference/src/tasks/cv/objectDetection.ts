import type { ObjectDetectionInput, ObjectDetectionOutput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";
import { preparePayload, type LegacyImageInput } from "./utils";

export type ObjectDetectionArgs = BaseArgs & (ObjectDetectionInput | LegacyImageInput);

/**
 * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
 * Recommended model: facebook/detr-resnet-50
 */
export async function objectDetection(args: ObjectDetectionArgs, options?: Options): Promise<ObjectDetectionOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, "object-detection");
	const payload = preparePayload(args);
	const { data: res } = await innerRequest<ObjectDetectionOutput>(payload, providerHelper, {
		...options,
		task: "object-detection",
	});
	return providerHelper.getResponse(res);
}
