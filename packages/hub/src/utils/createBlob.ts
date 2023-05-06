import { isFrontend } from "@huggingface/shared";
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
	if (url.protocol === "http:" || url.protocol === "https:") {
		return WebBlob.create(url);
	}

	if (isFrontend) {
		throw new TypeError(`Unsupported URL protocol "${url.protocol}"`);
	}

	if (url.protocol === "file:") {
		const { FileBlob } = await import("./FileBlob");

		return FileBlob.create(url);
	}

	throw new TypeError(`Unsupported URL protocol "${url.protocol}"`);
}
