import { getProviderHelper } from "../../lib/getProviderHelper";
import type { InferenceTask, Options, RequestArgs } from "../../types";
import { innerStreamingRequest } from "../../utils/request";

/**
 * Primitive to make custom inference calls that expect server-sent events, and returns the response through a generator
 * @deprecated Use specific task functions instead. This function will be removed in a future version.
 */
export async function* streamingRequest<T>(
	args: RequestArgs,
	options?: Options & {
		/** In most cases (unless we pass a endpointUrl) we know the task */
		task?: InferenceTask;
	}
): AsyncGenerator<T> {
	console.warn(
		"The streamingRequest method is deprecated and will be removed in a future version of huggingface.js. Use specific task functions instead."
	);
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", options?.task);
	yield* innerStreamingRequest(args, providerHelper, options);
}
