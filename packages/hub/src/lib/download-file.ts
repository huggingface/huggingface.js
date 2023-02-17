import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { Credentials, RepoId } from "../types";

/**
 * @returns null when the file doesn't exist
 */
export async function downloadFile(params: {
	repo:         RepoId;
	path:         string;
	/**
	 * If true, will download the raw git file.
	 *
	 * For example, when calling on a file stored with Git LFS, the pointer file will be downloaded instead.
	 */
	raw?:         boolean;
	revision?:    string;
	credentials?: Credentials;
}): Promise<Response | null> {
	const url = `${HUB_URL}/${params.repo.type === "model" ? "" : `${params.repo.type}s/`}${params.repo.name}/${
		params.raw ? "raw" : "resolve"
	}/${encodeURIComponent(params.revision ?? "main")}/${params.path}`;

	const resp = await fetch(url, {
		headers: params.credentials
			? {
					Authorization: `Bearer ${params.credentials.accessToken}`,
			  }
			: {},
	});

	if (resp.status === 404 && resp.headers.get("X-Error-Code") === "EntryNotFound") {
		return null;
	} else if (!resp.ok) {
		throw await createApiError(resp);
	}

	return resp;
}
