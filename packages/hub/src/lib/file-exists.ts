import type { Credentials, RepoDesignation } from "../types/public";
import { fileDownloadInfo } from "./file-download-info";

export async function fileExists(params: {
	repo: RepoDesignation;
	path: string;
	revision?: string;
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): Promise<boolean> {
	const info = await fileDownloadInfo({ ...params, raw: true, fetch: params.fetch });
	// ^use raw to not redirect and save some time for LFS files
	return !!info;
}
