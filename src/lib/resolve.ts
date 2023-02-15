import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { Credentials, RepoId } from "../types";

/**
 * @returns null when the file doesn't exist
 */
export async function resolve(params: {
	repo:         RepoId;
	credentials?: Credentials;
	path:         string;
	revision?:    string;
}): Promise<Response | null> {
	const url = `${HUB_URL}/${params.repo.type === "model" ? "" : `${params.repo.type}s/`}resolve/${encodeURIComponent(
		params.revision ?? "main"
	)}/${params.path}`;

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
		throw createApiError(resp);
	}

	return resp;
}
