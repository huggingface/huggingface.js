import { resolveProvider } from "../../lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import type { InferenceTask, Options, RequestArgs } from "../../types.js";
import { innerStreamingRequest } from "../../utils/request.js";
import { getLogger } from "../../lib/logger.js";

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
	const logger = getLogger();
	logger.warn(
		"The streamingRequest method is deprecated and will be removed in a future version of huggingface.js. Use specific task functions instead."
	);
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl);
	const providerHelper = getProviderHelper(provider, options?.task);
	yield* innerStreamingRequest(args, providerHelper, options);
}
