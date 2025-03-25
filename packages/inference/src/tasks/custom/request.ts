import { makeRequestOptions } from "../../lib/makeRequestOptions";
import type { InferenceTask, Options, RequestArgs } from "../../types";

export interface ResponseWrapper<T> {
	data: T;
	requestContext: {
		url: string;
		headers: Record<string, string>;
	};
}

/**
 * Primitive to make custom calls to the inference provider
 */
export async function request<T>(
	args: RequestArgs,
	options?: Options & {
		/** In most cases (unless we pass a endpointUrl) we know the task */
		task?: InferenceTask;
		/** Is chat completion compatible */
		chatCompletion?: boolean;
		/** Whether to include request context in the response */
		withRequestContext?: boolean;
	}
): Promise<Options extends { withRequestContext: true } ? ResponseWrapper<T> : T> {
	const { url, info } = await makeRequestOptions(args, options);
	const response = await (options?.fetch ?? fetch)(url, info);

	if (options?.retry_on_error !== false && response.status === 503) {
		return request(args, options);
	}

	if (!response.ok) {
		const contentType = response.headers.get("Content-Type");
		if (["application/json", "application/problem+json"].some((ct) => contentType?.startsWith(ct))) {
			const output = await response.json();
			if ([400, 422, 404, 500].includes(response.status) && options?.chatCompletion) {
				throw new Error(
					`Server ${args.model} does not seem to support chat completion. Error: ${JSON.stringify(output.error)}`
				);
			}
			if (output.error || output.detail) {
				throw new Error(JSON.stringify(output.error ?? output.detail));
			} else {
				throw new Error(output);
			}
		}
		const message = contentType?.startsWith("text/plain;") ? await response.text() : undefined;
		throw new Error(message ?? "An error occurred while fetching the blob");
	}

	const requestContext = { url, headers: info.headers as Record<string, string> };

	if (response.headers.get("Content-Type")?.startsWith("application/json")) {
		const data = await response.json();
		return options?.withRequestContext ? ({ data, requestContext } as unknown as T) : (data as T);
	}

	const blob = await response.blob();
	return options?.withRequestContext ? ({ data: blob, requestContext } as unknown as T) : (blob as T);
}
