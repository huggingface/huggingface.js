import { WebBlob } from "./WebBlob";
import { isFrontend } from "./isFrontend";

/**
 * This function allow to retrieve either a FileBlob or a WebBlob from a URL.
 *
 * From the backend:
 *   - support local files
 *   - support local folders
 *   - support http resources with absolute URLs
 *
 * From the frontend:
 *   - support http resources with absolute or relative URLs
 */
export async function createBlobs(url: URL, opts?: { fetch?: typeof fetch; maxFolderDepth?: number }): Promise<Blob[]> {
	if (url.protocol === "http:" || url.protocol === "https:") {
		return [await WebBlob.create(url, { fetch: opts?.fetch })];
	}

	if (isFrontend) {
		throw new TypeError(`Unsupported URL protocol "${url.protocol}"`);
	}

	if (url.protocol === "file:") {
		const { FileBlob } = await import("./FileBlob");
		const { subPaths } = await import("./sub-paths");
		const paths = await subPaths(url, opts?.maxFolderDepth);

		return Promise.all(paths.map((path) => FileBlob.create(path)));
	}

	throw new TypeError(`Unsupported URL protocol "${url.protocol}"`);
}
