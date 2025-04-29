import { getProviderHelper } from "../../lib/getProviderHelper";
import type { InferenceTask, Options, RequestArgs } from "../../types";
import { innerRequest } from "../../utils/request";

/**
 * Primitive to make custom calls to the inference provider
 * @deprecated Use specific task functions instead. This function will be removed in a future version.
 */
export async function request<T>(
	args: RequestArgs,
	options?: Options & {
		/** In most cases (unless we pass a endpointUrl) we know the task */
		task?: InferenceTask;
	}
): Promise<T> {
	console.warn(
		"The request method is deprecated and will be removed in a future version of huggingface.js. Use specific task functions instead."
	);
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", options?.task);
	const result = await innerRequest<T>(args, providerHelper, options);
	return result.data;
}
