const MAX_WARNED_TOPICS = 1000;
const warnedTopics = new Set<string>();

/**
 * Emit a `console.warn` for each warning sent by the server in the `X-HF-Warning` response header.
 *
 * Expected header format: `X-HF-Warning: topic; message`. The topic is optional and is only used for deduplication
 * (case-insensitive): only the first warning of each topic is shown. The last 100 distinct topics are remembered;
 * older topics may warn again after eviction.
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
				if (warnedTopics.size >= MAX_WARNED_TOPICS) {
					// Sets preserve insertion order, so evict the oldest topic.
					const oldestTopic = warnedTopics.values().next().value;
					if (oldestTopic !== undefined) {
						warnedTopics.delete(oldestTopic);
					}
				}
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
export function fetchWithServerWarnings(customFetch?: typeof fetch): typeof fetch {
	return async (...args) => {
		const response = await (customFetch ?? fetch)(...args);
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
