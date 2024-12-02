import { WebBlob } from "./WebBlob.js";

const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";

const isWebWorker =
	typeof self === "object" && self.constructor && self.constructor.name === "DedicatedWorkerGlobalScope";

const isBackend = !isBrowser && !isWebWorker;
const isFrontend = !isBackend;

/**
 * This function allow to retrieve either a FileBlob or a WebBlob from a URL.
 *
 * From the backend:
 *   - support local files
 *   - support http resources with absolute URLs
 *
 * From the frontend:
 *   - support http resources with absolute or relative URLs
 */
export async function createBlob(url: URL, opts?: { fetch?: typeof fetch }): Promise<Blob> {
	if (url.protocol === "http:" || url.protocol === "https:") {
		return WebBlob.create(url, { fetch: opts?.fetch });
	}

	if (isFrontend) {
		throw new TypeError(`Unsupported URL protocol "${url.protocol}"`);
	}

	if (url.protocol === "file:") {
		const { FileBlob } = await import("./FileBlob.js");

		return FileBlob.create(url);
	}

	throw new TypeError(`Unsupported URL protocol "${url.protocol}"`);
}
