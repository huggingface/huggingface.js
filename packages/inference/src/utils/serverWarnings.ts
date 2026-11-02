const warnedTopics = new Set<string>();

/**
 * Emit a `console.warn` for each warning sent by the server in the `X-HF-Warning` response header.
 *
 * Expected header format: `X-HF-Warning: topic; message`. The topic is optional and is only used for deduplication
 * (case-insensitive): only the first warning of each topic is shown.
 *
 * Several `X-HF-Warning` headers can be sent in a single response. The Fetch API joins them with ", ", so they are
 * split back on commas followed by a `topic;` prefix. A warning without topic is only split from the previous ones if it
 * comes first.
 */
export function warnOnServerWarnings(response: Response): void {
	try {
		const header = response.headers?.get("X-HF-Warning");
		if (!header) {
			return;
		}
		for (const serverWarning of header.split(/,\s*(?=[\w.-]+\s*;)/)) {
			const separatorIndex = serverWarning.indexOf(";");
			const topic = separatorIndex === -1 ? "" : serverWarning.slice(0, separatorIndex).trim().toLowerCase();
			const message = serverWarning.slice(separatorIndex + 1).trim();
			if (message && !warnedTopics.has(topic)) {
				warnedTopics.add(topic);
				console.warn(message);
			}
		}
	} catch {
		// Never fail a request because of warning parsing
	}
}

/**
 * Wrap a fetch function so that server warnings are surfaced for each response.
 */
export function fetchWithServerWarnings(
	customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
): (input: RequestInfo, init?: RequestInit) => Promise<Response> {
	return async (input, init) => {
		const response = await (customFetch ?? fetch)(input, init);
		warnOnServerWarnings(response);
		return response;
	};
}

/**
 * For tests only
 */
export function resetWarnedTopics(): void {
	warnedTopics.clear();
}
