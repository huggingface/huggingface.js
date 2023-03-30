import { isFrontend } from "./env-predicates";
import { WebBlob } from "./WebBlob";

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
export async function createBlob(url: URL): Promise<Blob> {
	if (isFrontend) {
		if (url.protocol === "http:" || url.protocol === "https:") {
			return WebBlob.create(url);
		}

		throw new TypeError(`Unsupported URL protocol "${url.protocol}"`);
	}

	if (url.protocol === "http:" || url.protocol === "https:") {
		return WebBlob.create(url);
	}

	if (url.protocol === "file:") {
		const { FileBlob } = await import("./FileBlob");

		return FileBlob.create(url);
	}

	throw new TypeError(`Unsupported URL protocol "${url.protocol}"`);
}
