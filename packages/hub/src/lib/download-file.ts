import type { CredentialsParams, RepoDesignation } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { WebBlob } from "../utils/WebBlob";
import { XetBlob } from "../utils/XetBlob";
import { fileDownloadInfo } from "./file-download-info";

/**
 * @returns null when the file doesn't exist
 */
export async function downloadFile(
	params: {
		repo: RepoDesignation;
		path: string;
		/**
		 * If true, will download the raw git file.
		 *
		 * For example, when calling on a file stored with Git LFS, the pointer file will be downloaded instead.
		 */
		raw?: boolean;
		/**
		 * An optional Git revision id which can be a branch name, a tag, or a commit hash.
		 *
		 * @default "main"
		 */
		revision?: string;
		/**
		 * Fetch only a specific part of the file
		 */
		range?: [number, number];
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>
): Promise<Blob | null> {
	const accessToken = checkCredentials(params);
	const info = await fileDownloadInfo({
		repo: params.repo,
		path: params.path,
		revision: params.revision,
		hubUrl: params.hubUrl,
		fetch: params.fetch,
		raw: params.raw,
	});

	if (!info) {
		return null;
	}

	if (info.xet) {
		return new XetBlob({
			hash: info.xet.hash,
			refreshUrl: info.xet.refreshUrl,
			fetch: params.fetch,
			accessToken,
			size: info.size,
		});
	}

	return new WebBlob(new URL(info.url), 0, info.size, "", true, params.fetch ?? fetch);
}
