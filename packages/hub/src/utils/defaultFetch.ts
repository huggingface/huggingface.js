import { isFrontend } from "./isFrontend";

/**
 * Whether the runtime's built-in fetch is undici >= 8 (Node >= 26), which negotiates HTTP/2 by default
 * with flow-control windows too small for fast large downloads. Bun and browsers never match.
 */
export function hasH2DefaultFetch(
	versions: Partial<Record<string, string>> | undefined = typeof process !== "undefined" ? process.versions : undefined,
	frontend = isFrontend,
): boolean {
	if (frontend || !versions?.undici || versions.bun) {
		return false;
	}
	return Number(versions.undici.split(".")[0]) >= 8;
}

let http1FetchPromise: Promise<typeof fetch> | undefined;

function loadHttp1Fetch(): Promise<typeof fetch> {
	http1FetchPromise ??= import("./http1Fetch-node").then((m) => m.http1Fetch);
	return http1FetchPromise;
}

/**
 * The fetch used for downloads when the caller does not pass one. On Node >= 26 it goes through
 * undici with HTTP/1.1 (see `http1Fetch-node.ts`); everywhere else it is the global fetch, looked up
 * at call time so test doubles installed on `globalThis` still apply.
 */
export const defaultFetch: typeof fetch = hasH2DefaultFetch()
	? async (input, init) => (await loadHttp1Fetch())(input, init)
	: (input, init) => fetch(input, init);
