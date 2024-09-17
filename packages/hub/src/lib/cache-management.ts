import { homedir } from "node:os";
import { join, basename } from "node:path";
import { stat, readdir, readFile, realpath, lstat } from "node:fs/promises";
import type { Stats } from "node:fs";

const default_home = join(homedir(), ".cache");
export const HF_HOME: string =
	process.env["HF_HOME"] ?? join(process.env["XDG_CACHE_HOME"] ?? default_home, "huggingface");

const default_cache_path = join(HF_HOME, "hub");

// Legacy env variable
export const HUGGINGFACE_HUB_CACHE = process.env["HUGGINGFACE_HUB_CACHE"] ?? default_cache_path;
// New env variable
export const HF_HUB_CACHE = process.env["HF_HUB_CACHE"] ?? HUGGINGFACE_HUB_CACHE;

const FILES_TO_IGNORE: string[] = [".DS_Store"];

export enum REPO_TYPE_T {
	MODEL = "model",
	DATASET = "dataset",
	SPACE = "space",
}

export interface CachedFileInfo {
	file_name: string;
	file_path: string;
	blob_path: string;
	size_on_disk: number;

	blob_last_accessed: number;
	blob_last_modified: number;
}

export interface CachedRevisionInfo {
	commit_hash: string;
	snapshot_path: string;
	size_on_disk: number;
	readonly files: Set<CachedFileInfo>;
	readonly refs: Set<string>;

	last_modified: number;
}

export interface CachedRepoInfo {
	repo_id: string;
	repo_type: REPO_TYPE_T;
	repo_path: string;
	size_on_disk: number;
	nb_files: number;
	readonly revisions: Set<CachedRevisionInfo>;

	last_accessed: number;
	last_modified: number;
}

export interface HFCacheInfo {
	size_on_disk: number;
	readonly repos: Set<CachedRepoInfo>;
	warnings: Error[];
}

export async function scan_cache_dir(cacheDir: string | undefined = undefined): Promise<HFCacheInfo> {
	if (!cacheDir) cacheDir = HF_HUB_CACHE;

	const s = await stat(cacheDir);
	if (!s.isDirectory()) {
		throw new Error(
			`Scan cache expects a directory but found a file: ${cacheDir}. Please use \`cacheDir\` argument or set \`HF_HUB_CACHE\` environment variable.`
		);
	}

	const repos = new Set<CachedRepoInfo>();
	const warnings: Error[] = [];

	const directories = await readdir(cacheDir);
	for (const repo of directories) {
		// skip .locks folder
		if (repo === ".locks") continue;

		// get the absolute path of the repo
		const absolute = join(cacheDir, repo);

		// ignore non-directory element
		const s = await stat(absolute);
		if (!s.isDirectory()) {
			continue;
		}

		try {
			const cached = await scan_cached_repo(absolute);
			repos.add(cached);
		} catch (err: unknown) {
			warnings.push(err as Error);
		}
	}

	return {
		repos: repos,
		size_on_disk: [...repos.values()].reduce((sum, repo) => sum + repo.size_on_disk, 0),
		warnings: warnings,
	};
}

export async function scan_cached_repo(repo_path: string): Promise<CachedRepoInfo> {
	// get the directory name
	const name = basename(repo_path);
	if (!name.includes("--")) {
		throw new Error(`Repo path is not a valid HuggingFace cache directory: ${name}`);
	}

	// parse the repoId from directory name
	const [type, ...remaining] = name.split("--");
	const repoType = parseRepoType(type);
	const repoId = remaining.join("/");

	const snapshotsPath = join(repo_path, "snapshots");
	const refsPath = join(repo_path, "refs");

	const snapshotStat = await stat(snapshotsPath);
	if (!snapshotStat.isDirectory()) {
		throw new Error(`Snapshots dir doesn't exist in cached repo ${snapshotsPath}`);
	}

	// Check if the refs directory exists and scan it
	const refsByHash: Map<string, Set<string>> = new Map();
	const refsStat = await stat(refsPath);
	if (refsStat.isDirectory()) {
		await scanRefsDir(refsPath, refsByHash);
	}

	// Scan snapshots directory and collect cached revision information
	const cachedRevisions: Set<CachedRevisionInfo> = new Set();
	const blobStats: Map<string, Stats> = new Map(); // Store blob stats

	const snapshotDirs = await readdir(snapshotsPath);
	for (const dir of snapshotDirs) {
		if (FILES_TO_IGNORE.includes(dir)) continue; // Ignore unwanted files

		const revisionPath = join(snapshotsPath, dir);
		const revisionStat = await stat(revisionPath);
		if (!revisionStat.isDirectory()) {
			throw new Error(`Snapshots folder corrupted. Found a file: ${revisionPath}`);
		}

		const cachedFiles: Set<CachedFileInfo> = new Set();
		await scanSnapshotDir(revisionPath, cachedFiles, blobStats);

		const revisionLastModified =
			cachedFiles.size > 0
				? Math.max(...[...cachedFiles].map((file) => file.blob_last_modified))
				: revisionStat.mtimeMs;

		cachedRevisions.add({
			commit_hash: dir,
			files: cachedFiles,
			refs: refsByHash.get(dir) || new Set(),
			size_on_disk: [...cachedFiles].reduce((sum, file) => sum + file.size_on_disk, 0),
			snapshot_path: revisionPath,
			last_modified: revisionLastModified,
		});

		refsByHash.delete(dir);
	}

	// Verify that all refs refer to a valid revision
	if (refsByHash.size > 0) {
		throw new Error(
			`Reference(s) refer to missing commit hashes: ${JSON.stringify(Object.fromEntries(refsByHash))} (${repo_path})`
		);
	}

	const repoStats = await stat(repo_path);
	const repoLastAccessed =
		blobStats.size > 0 ? Math.max(...[...blobStats.values()].map((stat) => stat.atimeMs)) : repoStats.atimeMs;

	const repoLastModified =
		blobStats.size > 0 ? Math.max(...[...blobStats.values()].map((stat) => stat.mtimeMs)) : repoStats.mtimeMs;

	// Return the constructed CachedRepoInfo object
	return {
		repo_id: repoId,
		repo_type: repoType,
		repo_path: repo_path,
		nb_files: blobStats.size,
		revisions: cachedRevisions,
		size_on_disk: [...blobStats.values()].reduce((sum, stat) => sum + stat.size, 0),
		last_accessed: repoLastAccessed,
		last_modified: repoLastModified,
	};
}

export async function scanRefsDir(refsPath: string, refsByHash: Map<string, Set<string>>): Promise<void> {
	const refFiles = await readdir(refsPath, { withFileTypes: true });
	for (const refFile of refFiles) {
		const refFilePath = join(refsPath, refFile.name);
		if (refFile.isDirectory()) continue; // Skip directories

		const commitHash = await readFile(refFilePath, "utf-8");
		const refName = refFile.name;
		if (!refsByHash.has(commitHash)) {
			refsByHash.set(commitHash, new Set());
		}
		refsByHash.get(commitHash)?.add(refName);
	}
}

export async function scanSnapshotDir(
	revisionPath: string,
	cachedFiles: Set<CachedFileInfo>,
	blobStats: Map<string, Stats>
): Promise<void> {
	const files = await readdir(revisionPath, { withFileTypes: true });
	for (const file of files) {
		if (file.isDirectory()) continue; // Skip directories

		const filePath = join(revisionPath, file.name);
		const blobPath = await realpath(filePath);
		const blobStat = await getBlobStat(blobPath, blobStats);

		cachedFiles.add({
			file_name: file.name,
			file_path: filePath,
			blob_path: blobPath,
			size_on_disk: blobStat.size,
			blob_last_accessed: blobStat.atimeMs,
			blob_last_modified: blobStat.mtimeMs,
		});
	}
}

export async function getBlobStat(blobPath: string, blobStats: Map<string, Stats>): Promise<Stats> {
	const blob = blobStats.get(blobPath);
	if (!blob) {
		const statResult = await lstat(blobPath);
		blobStats.set(blobPath, statResult);
		return statResult;
	}
	return blob;
}

export function parseRepoType(type: string): REPO_TYPE_T {
	switch (type) {
		case "models":
		case "model":
			return REPO_TYPE_T.MODEL;
		case REPO_TYPE_T.DATASET:
			return REPO_TYPE_T.DATASET;
		case REPO_TYPE_T.SPACE:
			return REPO_TYPE_T.SPACE;
		default:
			throw new Error("");
	}
}
