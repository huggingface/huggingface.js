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

/** The subset of undici's Dispatcher interface that `fetch` needs from `init.dispatcher`. */
export interface Dispatcher {
	dispatch(options: Record<string, unknown>, handler: unknown): boolean;
}

/**
 * Where undici keeps the global dispatcher that `fetch` uses (set on first use of `fetch` and by
 * `setGlobalDispatcher`). `.2` is the dispatcher itself; `.1` is the same dispatcher behind undici's
 * legacy-protocol wrapper, kept as a fallback.
 */
const GLOBAL_DISPATCHER_KEYS = [Symbol.for("undici.globalDispatcher.2"), Symbol.for("undici.globalDispatcher.1")];

/**
 * Forwards every request to `base` with HTTP/2 disabled. undici's Agent honors a per-request
 * `allowH2: false` by using a separate HTTP/1.1-only pool for that origin, so a user-installed global
 * dispatcher (proxy, custom TLS, ...) keeps working.
 */
export function withHttp1(base: Dispatcher): Dispatcher {
	return {
		dispatch: (options, handler) => base.dispatch({ ...options, allowH2: false }, handler),
	};
}

let cached: { base: Dispatcher; http1: Dispatcher } | undefined;

async function getHttp1Dispatcher(): Promise<Dispatcher | undefined> {
	const globals = globalThis as unknown as Record<symbol, Dispatcher | undefined>;
	const find = () => GLOBAL_DISPATCHER_KEYS.map((key) => globals[key]).find((d) => typeof d?.dispatch === "function");
	let base = find();
	if (base === undefined) {
		// The global dispatcher is created lazily by the first fetch; a data: URL needs no network.
		await (await fetch("data:,")).arrayBuffer();
		base = find();
	}
	if (base === undefined) {
		return undefined;
	}
	if (cached?.base !== base) {
		cached = { base, http1: withHttp1(base) };
	}
	return cached.http1;
}

/**
 * Node >= 26 bundles undici 8, whose fetch negotiates HTTP/2 when the server offers it and runs every
 * HTTP/2 session with fixed 256 KiB stream / 512 KiB connection flow-control windows. Each download
 * stream is then capped near `window / RTT`, about 3.5 MB/s at 75 ms RTT. Like the Hub server,
 * force HTTP/1.1, which uses TCP's autotuned receive window instead. Falls back to the plain fetch if
 * the global dispatcher cannot be found.
 */
const http1Fetch: typeof fetch = async (input, init) => {
	const dispatcher = await getHttp1Dispatcher();
	return dispatcher ? fetch(input, { ...init, dispatcher } as RequestInit) : fetch(input, init);
};

/**
 * The fetch used for xet downloads when the caller does not pass one. On Node >= 26 it forces HTTP/1.1;
 * everywhere else it is the global fetch, looked up at call time so test doubles installed on
 * `globalThis` still apply.
 */
export const defaultFetch: typeof fetch = hasH2DefaultFetch() ? http1Fetch : (input, init) => fetch(input, init);
