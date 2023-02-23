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
export async function fileDownloadInfo(params: {
	repo:                  RepoId;
	path:                  string;
	revision?:             string;
	credentials?:          Credentials;
	hubUrl?:               string;
	/**
	 * To get the raw pointer file behind a LFS file
	 */
	raw?:                  boolean;
	/**
	 * To avoid the content-disposition header in the `downloadLink` for LFS files
	 *
	 * So that on browsers you can use the URL in an iframe for example
	 */
	noContentDisposition?: boolean;
}): Promise<FileDownloadInfoOutput | null> {
	const url =
		`${params.hubUrl ?? HUB_URL}/${params.repo.type === "model" ? "" : `${params.repo.type}s/`}${params.repo.name}/${
			params.raw ? "raw" : "resolve"
		}/${encodeURIComponent(params.revision ?? "main")}/${params.path}` +
		(params.noContentDisposition ? "?noContentDisposition=1" : "");

	let resp = await fetch(url, {
		method:  "HEAD",
		headers: params.credentials
			? {
					Authorization: `Bearer ${params.credentials.accessToken}`,
			  }
			: {},
		redirect: "manual",
	});

	let redirects = 0;
	while (resp.status >= 300 && resp.status < 400 && new URL(resp.headers.get("Location")!).host === new URL(url).host) {
		if (++redirects >= 20) {
			throw new Error("Too many redirects");
		}

		resp = await fetch(url, {
			method:  "HEAD",
			headers: params.credentials
				? {
						Authorization: `Bearer ${params.credentials.accessToken}`,
				  }
				: {},
			redirect: "manual",
		});
	}

	if (resp.status === 404 && resp.headers.get("X-Error-Code") === "EntryNotFound") {
		return null;
	}

	let isLfs = false;

	if (resp.status >= 300 && resp.status < 400) {
		if (resp.headers.has("X-Linked-Size")) {
			isLfs = true;
		} else {
			throw new Error("Invalid response from server: redirect to external server should have X-Linked-Size header");
		}
	} else if (!resp.ok) {
		throw await createApiError(resp);
	}

	return {
		etag:         isLfs ? resp.headers.get("X-Linked-ETag")! : resp.headers.get("ETag")!,
		size:         isLfs ? parseInt(resp.headers.get("X-Linked-Size")!) : parseInt(resp.headers.get("Content-Length")!),
		downloadLink: isLfs ? resp.headers.get("Location") : null,
	};
}
