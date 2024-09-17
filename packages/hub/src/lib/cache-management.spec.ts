import { describe, test, expect, vi, beforeEach } from "vitest";
import {
	scan_cache_dir,
	scan_cached_repo,
	REPO_TYPE_T,
	scanSnapshotDir,
	parseRepoType,
	getBlobStat,
	type CachedFileInfo,
} from "./cache-management";
import { stat, readdir, realpath, lstat } from "node:fs/promises";
import type { Dirent, Stats } from "node:fs";
import { join } from "node:path";

// Mocks
vi.mock("node:fs/promises");

beforeEach(() => {
	vi.resetAllMocks();
	vi.restoreAllMocks();
});

describe("scan_cache_dir", () => {
	test("should throw an error if cacheDir is not a directory", async () => {
		vi.mocked(stat).mockResolvedValueOnce({
			isDirectory: () => false,
		} as Stats);

		await expect(scan_cache_dir("/fake/dir")).rejects.toThrow("Scan cache expects a directory");
	});

	test("empty directory should return an empty set of repository and no warnings", async () => {
		vi.mocked(stat).mockResolvedValueOnce({
			isDirectory: () => true,
		} as Stats);

		// mock empty cache folder
		vi.mocked(readdir).mockResolvedValue([]);

		const result = await scan_cache_dir("/fake/dir");

		// cacheDir must have been read
		expect(readdir).toHaveBeenCalledWith("/fake/dir");

		expect(result.warnings.length).toBe(0);
		expect(result.repos.size).toBe(0);
		expect(result.size_on_disk).toBe(0);
	});
});

describe("scan_cached_repo", () => {
	test("should throw an error for invalid repo path", async () => {
		await expect(() => {
			return scan_cached_repo("/fake/repo_path");
		}).rejects.toThrow("Repo path is not a valid HuggingFace cache directory");
	});

	test("should throw an error if the snapshot folder does not exist", async () => {
		vi.mocked(readdir).mockResolvedValue([]);
		vi.mocked(stat).mockResolvedValue({
			isDirectory: () => false,
		} as Stats);

		await expect(() => {
			return scan_cached_repo("/fake/cacheDir/models--hello-world--name");
		}).rejects.toThrow("Snapshots dir doesn't exist in cached repo");
	});

	test("should properly parse the repository name", async () => {
		const repoPath = "/fake/cacheDir/models--hello-world--name";
		vi.mocked(readdir).mockResolvedValue([]);
		vi.mocked(stat).mockResolvedValue({
			isDirectory: () => true,
		} as Stats);

		const result = await scan_cached_repo(repoPath);
		expect(readdir).toHaveBeenCalledWith(join(repoPath, "refs"), {
			withFileTypes: true,
		});

		expect(result.repo_id).toBe("hello-world/name");
	});
});

describe("scanSnapshotDir", () => {
	test("should scan a valid snapshot directory", async () => {
		const cachedFiles = new Set<CachedFileInfo>();
		const blobStats = new Map<string, Stats>();
		vi.mocked(readdir).mockResolvedValueOnce([{ name: "file1", isDirectory: () => false } as Dirent]);

		vi.mocked(realpath).mockResolvedValueOnce("/fake/realpath");
		vi.mocked(lstat).mockResolvedValueOnce({ size: 1024, atimeMs: Date.now(), mtimeMs: Date.now() } as Stats);

		await scanSnapshotDir("/fake/revision", cachedFiles, blobStats);

		expect(cachedFiles.size).toBe(1);
		expect(blobStats.size).toBe(1);
	});
});

describe("getBlobStat", () => {
	test("should retrieve blob stat if already cached", async () => {
		const blobStats = new Map<string, Stats>([["/fake/blob", { size: 1024 } as Stats]]);
		const result = await getBlobStat("/fake/blob", blobStats);

		expect(result.size).toBe(1024);
	});

	test("should fetch and cache blob stat if not cached", async () => {
		const blobStats = new Map();
		vi.mocked(lstat).mockResolvedValueOnce({ size: 2048 } as Stats);

		const result = await getBlobStat("/fake/blob", blobStats);

		expect(result.size).toBe(2048);
		expect(blobStats.size).toBe(1);
	});
});

describe("parseRepoType", () => {
	test("should parse model repo type", () => {
		expect(parseRepoType("model")).toBe(REPO_TYPE_T.MODEL);
	});

	test("should parse dataset repo type", () => {
		expect(parseRepoType("dataset")).toBe(REPO_TYPE_T.DATASET);
	});

	test("should throw an error for invalid repo type", () => {
		expect(() => parseRepoType("invalid")).toThrow();
	});
});
