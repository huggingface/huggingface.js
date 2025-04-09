import { getHFHubCachePath, getRepoFolderName } from "./cache-management";
import { dirname, join } from "node:path";
import { writeFile, rename, lstat, mkdir, stat } from "node:fs/promises";
import { pathsInfo } from "./paths-info";
import type { CredentialsParams, RepoDesignation } from "../types/public";
import { toRepoId } from "../utils/toRepoId";
import { downloadFile } from "./download-file";
import { createSymlink } from "../utils/symlink";

export type DownloadFileToCacheDirParams = {
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
	hubUrl?: string;
	cacheDir?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
} & Partial<CredentialsParams>

export const REGEX_COMMIT_HASH: RegExp = new RegExp("^[0-9a-f]{40}$");

export function getFilePointer(storageFolder: string, revision: string, relativeFilename: string): string {
	const snapshotPath = join(storageFolder, "snapshots");
	return join(snapshotPath, revision, relativeFilename);
}

/**
 * handy method to check if a file exists, or the pointer of a symlinks exists
 * @param path
 * @param followSymlinks
 */
export async function exists(path: string, followSymlinks?: boolean): Promise<boolean> {
	try {
		if (followSymlinks) {
			await stat(path);
		} else {
			await lstat(path);
		}
		return true;
	} catch (err: unknown) {
		return false;
	}
}

export async function preparePaths(params: DownloadFileToCacheDirParams, storageFolder: string): Promise<{ pointerPath: string; blobPath: string; etag: string }> {
	const pathsInformation = await pathsInfo({
		...params,
		paths: [params.path],
		revision: params.revision ?? "main",
		expand: true,
	});

	if (!pathsInformation || pathsInformation.length !== 1) {
		throw new Error(`cannot get path info for ${params.path}`);
	}

	const pathInfo = pathsInformation[0];
	const etag = pathInfo.lfs ? pathInfo.lfs.oid : pathInfo.oid;
	const pointerPath = getFilePointer(storageFolder, pathInfo.lastCommit.id, params.path);
	const blobPath = join(storageFolder, "blobs", etag);

	return { pointerPath, blobPath, etag };
}

export async function ensureDirectories(blobPath: string, pointerPath: string): Promise<void> {
	await mkdir(dirname(blobPath), { recursive: true });
	await mkdir(dirname(pointerPath), { recursive: true });
}

export async function downloadAndStoreFile(params: DownloadFileToCacheDirParams, blobPath: string): Promise<void> {
	const incomplete = `${blobPath}.incomplete`;
	console.debug(`Downloading ${params.path} to ${incomplete}`);

	const response = await downloadFile(params);
	if (!response || !response.ok || !response.body) {
		throw new Error(`Invalid response for file ${params.path}`);
	}

	// @ts-expect-error resp.body is a Stream, but Stream in internal to node
	await writeFile(incomplete, response.body);
	await rename(incomplete, blobPath);
}

export type PrepareDownloadFileToCacheDirResult = {
	exists: true,
	pointerPath: string
	blobPath?: undefined,
} | {
	exists: false,
	pointerPath: string;
	blobPath: string;
}

export async function prepareDownloadFileToCacheDir(params: DownloadFileToCacheDirParams): Promise<PrepareDownloadFileToCacheDirResult> {
	// get revision provided or default to main
	const revision = params.revision ?? "main";
	const cacheDir = params.cacheDir ?? getHFHubCachePath();
	// get repo id
	const repoId = toRepoId(params.repo);
	// get storage folder
	const storageFolder = join(cacheDir, getRepoFolderName(repoId));

	// if user provides a commitHash as revision, and they already have the file on disk, shortcut everything.
	if (REGEX_COMMIT_HASH.test(revision)) {
		const pointerPath = getFilePointer(storageFolder, revision, params.path);
		if (await exists(pointerPath, true)) return {
			exists: true,
			pointerPath: pointerPath,
		};
	}

	const { pointerPath, blobPath } = await preparePaths(params, storageFolder);

	// if we have the pointer file, we can shortcut the download
	if (await exists(pointerPath, true)) return {
		exists: true,
		pointerPath: pointerPath,
	};

	// mkdir blob and pointer path parent directory
	await ensureDirectories(blobPath, pointerPath);

	// We might already have the blob but not the pointer
	// shortcut the download if needed
	if (await exists(blobPath)) {
		// create symlinks in snapshot folder to blob object
		await createSymlink({ sourcePath: blobPath, finalPath: pointerPath });
		return { exists: true, pointerPath, }
	}

	return {
		exists: false,
		pointerPath: pointerPath,
		blobPath: blobPath,
	}
}

/**
 * Download a given file if it's not already present in the local cache.
 * @param params
 * @return the symlink to the blob object
 */
export async function downloadFileToCacheDir(
	params: DownloadFileToCacheDirParams
): Promise<string> {
	const { exists, pointerPath, blobPath } = await prepareDownloadFileToCacheDir(params);
	if(exists) return pointerPath;

	// download the file if we don't have it
	await downloadAndStoreFile(params, blobPath);

	await createSymlink({ sourcePath: blobPath, finalPath: pointerPath });
	return pointerPath;
}
