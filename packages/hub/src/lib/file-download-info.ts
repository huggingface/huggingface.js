import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { Credentials, RepoId } from "../types";

export interface FileDownloadInfoOutput {
	size:         number;
	etag:         string;
	/**
	 * In case of LFS file, link to download directly from cloud provider
	 */
	downloadLink: string | null;
}
/**
 * @returns null when the file doesn't exist
 */
export function fileDownloadInfo(params: {
	repo:         RepoId;
	path:         string;
	revision?:    string;
	credentials?: Credentials;
	hubUrl?:      string;
	/**
	 * To get the raw pointer file behind a LFS file
	 */
	raw?:         boolean;
}): Promise<FileDownloadInfoOutput | null> {
	const url = `${params.hubUrl ?? HUB_URL}/${params.repo.type === "model" ? "" : `${params.repo.type}s/`}${
		params.repo.name
	}/${params.raw ? "raw" : "resolve"}/${encodeURIComponent(params.revision ?? "main")}/${params.path}`;

	return fileDownloadInfoInternal(url, params.credentials);
}

async function fileDownloadInfoInternal(
	url: string,
	credentials?: Credentials,
	redirects = 0
): Promise<FileDownloadInfoOutput | null> {
	if (redirects >= 20) {
		throw new Error("Too many redirects");
	}

	const resp = await fetch(url, {
		method:  "HEAD",
		headers: credentials
			? {
					Authorization: `Bearer ${credentials.accessToken}`,
			  }
			: {},
		redirect: "manual",
	});

	if (resp.status === 404 && resp.headers.get("X-Error-Code") === "EntryNotFound") {
		return null;
	}

	let isLfs = false;
	if (resp.status >= 300 && resp.status < 400) {
		if (resp.headers.get("Location")?.startsWith(HUB_URL)) {
			// can happen on repo name change
			return fileDownloadInfoInternal(resp.headers.get("Location")!, credentials, redirects + 1);
		}

		if (!resp.headers.has("X-Linked-Size")) {
			throw new Error("Invalid response from server: redirect to external server should have X-Linked-Size header");
		}
		isLfs = true;
	} else if (!resp.ok) {
		throw await createApiError(resp);
	}

	return {
		etag:         isLfs ? resp.headers.get("X-Linked-ETag")! : resp.headers.get("ETag")!,
		size:         isLfs ? parseInt(resp.headers.get("X-Linked-Size")!) : parseInt(resp.headers.get("Content-Length")!),
		downloadLink: isLfs ? resp.headers.get("Location") : null,
	};
}
