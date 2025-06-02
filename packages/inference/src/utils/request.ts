import type { getProviderHelper } from "../lib/getProviderHelper.js";
import { makeRequestOptions } from "../lib/makeRequestOptions.js";
import type { InferenceTask, Options, RequestArgs } from "../types.js";
import type { EventSourceMessage } from "../vendor/fetch-event-source/parse.js";
import { getLines, getMessages } from "../vendor/fetch-event-source/parse.js";
import { InferenceClientProviderApiError } from "../errors.js";
import type { JsonObject } from "../vendor/type-fest/basic.js";

export interface ResponseWrapper<T> {
	data: T;
	requestContext: {
		url: string;
		info: RequestInit;
	};
}

function requestArgsToJson(args: RequestArgs): JsonObject {
	// Convert the entire args object to a JSON-serializable format
	const argsWithData = args as RequestArgs & { data?: Blob | ArrayBuffer };
	return JSON.parse(
		JSON.stringify({
			...argsWithData,
			data: argsWithData.data ? "[Blob or ArrayBuffer]" : null,
		})
	) as JsonObject;
}

/**
 * Primitive to make custom calls to the inference provider
 */
export async function innerRequest<T>(
	args: RequestArgs,
	providerHelper: ReturnType<typeof getProviderHelper>,
	options?: Options & {
		/** In most cases (unless we pass a endpointUrl) we know the task */
		task?: InferenceTask;
		/** Is chat completion compatible */
		chatCompletion?: boolean;
	}
): Promise<ResponseWrapper<T>> {
	const { url, info } = await makeRequestOptions(args, providerHelper, options);
	const response = await (options?.fetch ?? fetch)(url, info);

	const requestContext: ResponseWrapper<T>["requestContext"] = { url, info };

	if (options?.retry_on_error !== false && response.status === 503) {
		return innerRequest(args, providerHelper, options);
	}

	if (!response.ok) {
		const contentType = response.headers.get("Content-Type");
		if (["application/json", "application/problem+json"].some((ct) => contentType?.startsWith(ct))) {
			const output = await response.json();
			if ([400, 422, 404, 500].includes(response.status) && options?.chatCompletion) {
				throw new InferenceClientProviderApiError(
					`Provider ${args.provider} does not seem to support chat completion for model ${
						args.model
					} . Error: ${JSON.stringify(output.error)}`,
					{
						url,
						method: info.method ?? "GET",
						headers: info.headers as Record<string, string>,
						body: requestArgsToJson(args),
					},
					{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: output }
				);
			}
			if (typeof output.error === "string" || typeof output.detail === "string") {
				throw new InferenceClientProviderApiError(
					`Failed to perform inference: ${output.error ?? output.detail}`,
					{
						url,
						method: info.method ?? "GET",
						headers: info.headers as Record<string, string>,
						body: requestArgsToJson(args),
					},
					{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: output }
				);
			} else {
				throw new InferenceClientProviderApiError(
					`Failed to perform inference: an HTTP error occurred when requesting the provider.`,
					{
						url,
						method: info.method ?? "GET",
						headers: info.headers as Record<string, string>,
						body: requestArgsToJson(args),
					},
					{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: output }
				);
			}
		}
		const message = contentType?.startsWith("text/plain;") ? await response.text() : undefined;
		throw new InferenceClientProviderApiError(
			`Failed to perform inference: ${message ?? "an HTTP error occurred when requesting the provider"}`,
			{
				url,
				method: info.method ?? "GET",
				headers: info.headers as Record<string, string>,
				body: requestArgsToJson(args),
			},
			{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: message ?? "" }
		);
	}

	if (response.headers.get("Content-Type")?.startsWith("application/json")) {
		const data = (await response.json()) as T;
		return { data, requestContext };
	}

	const blob = (await response.blob()) as T;
	return { data: blob as unknown as T, requestContext };
}

/**
 * Primitive to make custom inference calls that expect server-sent events, and returns the response through a generator
 */
export async function* innerStreamingRequest<T>(
	args: RequestArgs,
	providerHelper: ReturnType<typeof getProviderHelper>,
	options?: Options & {
		/** In most cases (unless we pass a endpointUrl) we know the task */
		task?: InferenceTask;
		/** Is chat completion compatible */
		chatCompletion?: boolean;
	}
): AsyncGenerator<T> {
	const { url, info } = await makeRequestOptions({ ...args, stream: true }, providerHelper, options);
	const response = await (options?.fetch ?? fetch)(url, info);

	if (options?.retry_on_error !== false && response.status === 503) {
		return yield* innerStreamingRequest(args, providerHelper, options);
	}
	if (!response.ok) {
		if (response.headers.get("Content-Type")?.startsWith("application/json")) {
			const output = await response.json();
			if ([400, 422, 404, 500].includes(response.status) && options?.chatCompletion) {
				throw new InferenceClientProviderApiError(
					`Provider ${args.provider} does not seem to support chat completion for model ${
						args.model
					} . Error: ${JSON.stringify(output.error)}`,
					{
						url,
						method: info.method ?? "GET",
						headers: info.headers as Record<string, string>,
						body: requestArgsToJson(args),
					},
					{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: output }
				);
			}
			if (typeof output.error === "string") {
				throw new InferenceClientProviderApiError(
					`Failed to perform inference: ${output.error}`,
					{
						url,
						method: info.method ?? "GET",
						headers: info.headers as Record<string, string>,
						body: requestArgsToJson(args),
					},
					{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: output }
				);
			}
			if (output.error && "message" in output.error && typeof output.error.message === "string") {
				/// OpenAI errors
				throw new InferenceClientProviderApiError(
					`Failed to perform inference: ${output.error.message}`,
					{
						url,
						method: info.method ?? "GET",
						headers: info.headers as Record<string, string>,
						body: requestArgsToJson(args),
					},
					{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: output }
				);
			}
			// Sambanova errors
			if (typeof output.message === "string") {
				throw new InferenceClientProviderApiError(
					`Failed to perform inference: ${output.message}`,
					{
						url,
						method: info.method ?? "GET",
						headers: info.headers as Record<string, string>,
						body: requestArgsToJson(args),
					},
					{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: output }
				);
			}
		}

		throw new InferenceClientProviderApiError(
			`Failed to perform inference: an HTTP error occurred when requesting the provider.`,
			{
				url,
				method: info.method ?? "GET",
				headers: info.headers as Record<string, string>,
				body: requestArgsToJson(args),
			},
			{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: "" }
		);
	}
	if (!response.headers.get("content-type")?.startsWith("text/event-stream")) {
		throw new InferenceClientProviderApiError(
			`Failed to perform inference: server does not support event stream content type, it returned ` +
				response.headers.get("content-type"),
			{
				url,
				method: info.method ?? "GET",
				headers: info.headers as Record<string, string>,
				body: requestArgsToJson(args),
			},
			{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: "" }
		);
	}

	if (!response.body) {
		return;
	}

	const reader = response.body.getReader();
	let events: EventSourceMessage[] = [];

	const onEvent = (event: EventSourceMessage) => {
		// accumulate events in array
		events.push(event);
	};

	const onChunk = getLines(
		getMessages(
			() => {},
			() => {},
			onEvent
		)
	);

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				return;
			}
			onChunk(value);
			for (const event of events) {
				if (event.data.length > 0) {
					if (event.data === "[DONE]") {
						return;
					}
					const data = JSON.parse(event.data);
					if (typeof data === "object" && data !== null && "error" in data) {
						const errorStr =
							typeof data.error === "string"
								? data.error
								: typeof data.error === "object" &&
								    data.error &&
								    "message" in data.error &&
								    typeof data.error.message === "string"
								  ? data.error.message
								  : JSON.stringify(data.error);
						throw new InferenceClientProviderApiError(
							`Failed to perform inference: an occurred while streaming the response: ${errorStr}`,
							{
								url,
								method: info.method ?? "GET",
								headers: info.headers as Record<string, string>,
								body: requestArgsToJson(args),
							},
							{ requestId: response.headers.get("x-request-id") ?? "", status: response.status, body: data }
						);
					}
					yield data as T;
				}
			}
			events = [];
		}
	} finally {
		reader.releaseLock();
	}
}
