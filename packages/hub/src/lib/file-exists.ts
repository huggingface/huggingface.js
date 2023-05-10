import type { Credentials, RepoDesignation } from "../types/public";
import { fileDownloadInfo } from "./file-download-info";

export async function fileExists(params: {
	repo: RepoDesignation;
	path: string;
	revision?: string;
	credentials?: Credentials;
	hubUrl?: string;
}): Promise<boolean> {
	const info = await fileDownloadInfo({ ...params, raw: true });
	// ^use raw to not redirect and save some time for LFS files
	return !!info;
}
