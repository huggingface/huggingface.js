import type { InferenceTask, Options, RequestArgs } from "../../types";
import { makeRequestOptions } from "../../lib/makeRequestOptions";

/**
 * Primitive to make custom calls to Inference Endpoints
 */
export async function request<T>(
	args: RequestArgs,
	options?: Options & {
		/** When a model can be used for multiple tasks, and we want to run a non-default task */
		task?: string | InferenceTask;
		/** To load default model if needed */
		taskHint?: InferenceTask;
		/** Is chat completion compatible */
		chatCompletion?: boolean;
	}
): Promise<T> {
	const { url, info } = await makeRequestOptions(args, options);
	const response = await (options?.fetch ?? fetch)(url, info);

	if (options?.retry_on_error !== false && response.status === 503 && !options?.wait_for_model) {
		return request(args, {
			...options,
			wait_for_model: true,
		});
	}

	if (!response.ok) {
		if (response.headers.get("Content-Type")?.startsWith("application/json")) {
			const output = await response.json();
			if ([400, 422, 404, 500].includes(response.status) && options?.chatCompletion) {
				throw new Error(`Server ${args.model} does not seem to support chat completion. Error: ${output.error}`);
			}
			if (output.error) {
				throw new Error(output.error);
			}
		}
		throw new Error("An error occurred while fetching the blob");
	}

	if (response.headers.get("Content-Type")?.startsWith("application/json")) {
		return await response.json();
	}

	return (await response.blob()) as T;
}
