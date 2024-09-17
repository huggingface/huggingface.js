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
	filename: string;
	filePath: string;
	blobPath: string;
	sizeOnDisk: number;

	blobLastAccessed: number;
	blobLastModified: number;
}

export interface CachedRevisionInfo {
	commitHash: string;
	snapshotPath: string;
	sizeOnDisk: number;
	readonly files: Set<CachedFileInfo>;
	readonly refs: Set<string>;

	lastModified: number;
}

export interface CachedRepoInfo {
	repoId: string;
	repoType: REPO_TYPE_T;
	repoPath: string;
	sizeOnDisk: number;
	nbFiles: number;
	readonly revisions: Set<CachedRevisionInfo>;

	lastAccessed: number;
	lastModified: number;
}

export interface HFCacheInfo {
	sizeOnDisk: number;
	readonly repos: Set<CachedRepoInfo>;
	warnings: Error[];
}

export async function scanCacheDir(cacheDir: string | undefined = undefined): Promise<HFCacheInfo> {
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
			const cached = await scanCachedRepo(absolute);
			repos.add(cached);
		} catch (err: unknown) {
			warnings.push(err as Error);
		}
	}

	return {
		repos: repos,
		sizeOnDisk: [...repos.values()].reduce((sum, repo) => sum + repo.sizeOnDisk, 0),
		warnings: warnings,
	};
}

export async function scanCachedRepo(repoPath: string): Promise<CachedRepoInfo> {
	// get the directory name
	const name = basename(repoPath);
	if (!name.includes("--")) {
		throw new Error(`Repo path is not a valid HuggingFace cache directory: ${name}`);
	}

	// parse the repoId from directory name
	const [type, ...remaining] = name.split("--");
	const repoType = parseRepoType(type);
	const repoId = remaining.join("/");

	const snapshotsPath = join(repoPath, "snapshots");
	const refsPath = join(repoPath, "refs");

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
			cachedFiles.size > 0 ? Math.max(...[...cachedFiles].map((file) => file.blobLastModified)) : revisionStat.mtimeMs;

		cachedRevisions.add({
			commitHash: dir,
			files: cachedFiles,
			refs: refsByHash.get(dir) || new Set(),
			sizeOnDisk: [...cachedFiles].reduce((sum, file) => sum + file.sizeOnDisk, 0),
			snapshotPath: revisionPath,
			lastModified: revisionLastModified,
		});

		refsByHash.delete(dir);
	}

	// Verify that all refs refer to a valid revision
	if (refsByHash.size > 0) {
		throw new Error(
			`Reference(s) refer to missing commit hashes: ${JSON.stringify(Object.fromEntries(refsByHash))} (${repoPath})`
		);
	}

	const repoStats = await stat(repoPath);
	const repoLastAccessed =
		blobStats.size > 0 ? Math.max(...[...blobStats.values()].map((stat) => stat.atimeMs)) : repoStats.atimeMs;

	const repoLastModified =
		blobStats.size > 0 ? Math.max(...[...blobStats.values()].map((stat) => stat.mtimeMs)) : repoStats.mtimeMs;

	// Return the constructed CachedRepoInfo object
	return {
		repoId: repoId,
		repoType: repoType,
		repoPath: repoPath,
		nbFiles: blobStats.size,
		revisions: cachedRevisions,
		sizeOnDisk: [...blobStats.values()].reduce((sum, stat) => sum + stat.size, 0),
		lastAccessed: repoLastAccessed,
		lastModified: repoLastModified,
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
			filename: file.name,
			filePath: filePath,
			blobPath: blobPath,
			sizeOnDisk: blobStat.size,
			blobLastAccessed: blobStat.atimeMs,
			blobLastModified: blobStat.mtimeMs,
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
