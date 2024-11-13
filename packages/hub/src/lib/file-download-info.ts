import { HUB_URL } from "../consts";
import { createApiError, InvalidApiResponseFormatError } from "../error";
import type { CredentialsParams, RepoDesignation } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { toRepoId } from "../utils/toRepoId";

const HUGGINGFACE_HEADER_X_REPO_COMMIT = "X-Repo-Commit"
const HUGGINGFACE_HEADER_X_LINKED_ETAG = "X-Linked-Etag"
const HUGGINGFACE_HEADER_X_LINKED_SIZE = "X-Linked-Size"

export interface FileDownloadInfoOutput {
	size: number;
	etag: string;
	commitHash: string | null;
	/**
	 * In case of LFS file, link to download directly from cloud provider
	 */
	downloadLink: string | null;
}

/**
 * Useful when we want to follow a redirection to a renamed repository without following redirection to a CDN.
 * If a Location header is `/hello` we should follow the relative direct
 * However we may have full url redirect, on the same origin, we need to properly compare the origin then.
 * @param params
 */
async function followSameOriginRedirect(params: {
	url: string,
	method: string,
	headers: Record<string, string>,
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): Promise<Response> {
	const resp = await (params.fetch ?? fetch)(params.url, {
		method: params.method,
		headers: params.headers,
		// prevent automatic redirect
		redirect: 'manual',
	});

	const location: string | null = resp.headers.get('Location');
	if(!location) return resp;

	// new URL('http://foo/bar', 'http://example.com/hello').href == http://foo/bar
	// new URL('/bar', 'http://example.com/hello').href == http://example.com/bar
	const nURL = new URL(location, params.url);
	// ensure origin are matching
	if(new URL(params.url).origin !== nURL.origin)
		return resp;

	return followSameOriginRedirect({
		...params,
		url: nURL.href,
	});
}

/**
 * @returns null when the file doesn't exist
 */
export async function fileDownloadInfo(
	params: {
		repo: RepoDesignation;
		path: string;
		revision?: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
		/**
		 * To get the raw pointer file behind a LFS file
		 */
		raw?: boolean;
		/**
		 * To avoid the content-disposition header in the `downloadLink` for LFS files
		 *
		 * So that on browsers you can use the URL in an iframe for example
		 */
		noContentDisposition?: boolean;
	} & Partial<CredentialsParams>
): Promise<FileDownloadInfoOutput | null> {
	const accessToken = checkCredentials(params);
	const repoId = toRepoId(params.repo);

	const hubUrl = params.hubUrl ?? HUB_URL;
	const url =
		`${hubUrl}/${repoId.type === "model" ? "" : `${repoId.type}s/`}${repoId.name}/${
			params.raw ? "raw" : "resolve"
		}/${encodeURIComponent(params.revision ?? "main")}/${params.path}` +
		(params.noContentDisposition ? "?noContentDisposition=1" : "");

	//
	const resp = await followSameOriginRedirect({
		url: url,
		method: "HEAD",
		headers: {
			...(params.credentials && {
				Authorization: `Bearer ${accessToken}`,
				// prevent any compression => we want to know the real size of the file
				'Accept-Encoding': 'identity',
			}),
		},
	});

	if (resp.status === 404 && resp.headers.get("X-Error-Code") === "EntryNotFound") {
		return null;
	}

	// redirect to CDN is okay not an error
	if (!resp.ok && !resp.headers.get('Location')) {
		throw await createApiError(resp);
	}

	// We favor a custom header indicating the etag of the linked resource, and
	// we fallback to the regular etag header.
	const etag = resp.headers.get(HUGGINGFACE_HEADER_X_LINKED_ETAG) ?? resp.headers.get("ETag");
	if (!etag) {
		throw new InvalidApiResponseFormatError("Expected ETag");
	}

	// size is required
	const contentSize = resp.headers.get(HUGGINGFACE_HEADER_X_LINKED_SIZE) ?? resp.headers.get("Content-Length")
	if (!contentSize) {
		throw new InvalidApiResponseFormatError("Expected size information");
	}

	const size = parseInt(contentSize);

	if (isNaN(size)) {
		throw new InvalidApiResponseFormatError("Invalid file size received");
	}

	return {
		etag,
		size,
		// Either from response headers (if redirected) or defaults to request url
		downloadLink: resp.headers.get('Location') ?? new URL(resp.url).hostname !== new URL(hubUrl).hostname ? resp.url : null,
		commitHash: resp.headers.get(HUGGINGFACE_HEADER_X_REPO_COMMIT),
	};
}
