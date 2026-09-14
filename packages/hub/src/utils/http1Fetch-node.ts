import { Agent, fetch as undiciFetch } from "undici";

/**
 * Node >= 26 bundles undici 8, whose fetch negotiates HTTP/2 when the server offers it and runs every
 * HTTP/2 session with fixed 256 KiB stream / 512 KiB connection flow-control windows. Each download
 * stream is then capped near `window / (2 * RTT)`, about 1.7 MB/s at 75 ms RTT. Like the Hub server,
 * force HTTP/1.1, which uses TCP's autotuned receive window instead.
 */
const dispatcher = new Agent({ allowH2: false });

export const http1Fetch: typeof fetch = (input, init) =>
	undiciFetch(input as Parameters<typeof undiciFetch>[0], {
		...(init as Parameters<typeof undiciFetch>[1]),
		dispatcher,
	}) as unknown as Promise<Response>;
