/**
 * Parse Link HTTP header, eg `<https://huggingface.co/api/datasets/bigscience/P3/tree/main?recursive=1&cursor=...>; rel="next"`
 */
export function parseLinkHeader(header: string): Record<string, string> {
	// Consume quoted parameter values together so their separators and rel-like text remain opaque.
	const regex = /<(https?:[/][/][^>]+)>|;\s*([^=;,\s]+)\s*=\s*(?:"((?:\\.|[^"\\])*)"|[^;,"\s]*)|,/g;
	const links: [string, string][] = [];
	let targetUrl: string | undefined;

	for (const match of header.matchAll(regex)) {
		const [, url, parameter, value] = match;
		if (url) {
			targetUrl = url;
		} else if (match[0] === ",") {
			targetUrl = undefined;
		} else if (parameter === "rel" && targetUrl) {
			if (value) {
				links.push([value, targetUrl]);
			}
			targetUrl = undefined;
		}
	}

	return Object.fromEntries(links);
}
