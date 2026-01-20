import { HUB_URL } from "../../consts";
import { createApiError } from "../../error";
import type { CredentialsParams } from "../../types/public";
import { checkCredentials } from "../../utils/checkCredentials";

/**
 * Stream job logs using Server-Sent Events (SSE).
 * Returns an async iterable of log chunks.
 */
export async function* streamJobLogs(
	params: {
		/**
		 * The namespace (username or organization name)
		 */
		namespace: string;
		/**
		 * The job ID
		 */
		jobId: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams,
): AsyncGenerator<string, void, unknown> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}/${params.jobId}/logs`,
		{
			headers: {
				Accept: "text/event-stream",
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	if (!response.body) {
		return;
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					yield line.slice(6);
				}
			}
		}

		// Process remaining buffer
		if (buffer) {
			const lines = buffer.split("\n");
			for (const line of lines) {
				if (line.startsWith("data: ")) {
					yield line.slice(6);
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}
