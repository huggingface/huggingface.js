import type { InferenceTask, Options, RequestArgs } from "../../types";
import { makeRequestOptions } from "../../lib/makeRequestOptions";
import type { EventSourceMessage } from "../../vendor/fetch-event-source/parse";
import { getLines, getMessages } from "../../vendor/fetch-event-source/parse";

/**
 * Primitive to make custom inference calls that expect server-sent events, and returns the response through a generator
 */
export async function* streamingRequest<T>(
	args: RequestArgs,
	options?: Options & {
		/** In most cases (unless we pass a endpointUrl) we know the task */
		task?: InferenceTask;
		/** Is chat completion compatible */
		chatCompletion?: boolean;
	}
): AsyncGenerator<T> {
	const { url, info } = await makeRequestOptions({ ...args, stream: true }, options);
	const response = await (options?.fetch ?? fetch)(url, info);

	if (options?.retry_on_error !== false && response.status === 503) {
		return yield* streamingRequest(args, options);
	}
	if (!response.ok) {
		if (response.headers.get("Content-Type")?.startsWith("application/json")) {
			const output = await response.json();
			if ([400, 422, 404, 500].includes(response.status) && options?.chatCompletion) {
				throw new Error(`Server ${args.model} does not seem to support chat completion. Error: ${output.error}`);
			}
			if (typeof output.error === "string") {
				throw new Error(output.error);
			}
			if (output.error && "message" in output.error && typeof output.error.message === "string") {
				/// OpenAI errors
				throw new Error(output.error.message);
			}
		}

		throw new Error(`Server response contains error: ${response.status}`);
	}
	if (!response.headers.get("content-type")?.startsWith("text/event-stream")) {
		throw new Error(
			`Server does not support event stream content type, it returned ` + response.headers.get("content-type")
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
						throw new Error(`Error forwarded from backend: ` + errorStr);
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
