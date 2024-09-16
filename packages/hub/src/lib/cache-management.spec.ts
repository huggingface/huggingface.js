import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as cacheManagement from './cache-management';
import { stat, readdir, realpath, lstat } from 'node:fs/promises';
import { Stats } from "node:fs";

// Mocks
vi.mock('node:fs/promises');

beforeEach(() => {
	vi.resetAllMocks();
	vi.restoreAllMocks();
});

describe('scan_cache_dir', () => {
	test('should throw an error if cacheDir is not a directory', async () => {
		vi.mocked(stat).mockResolvedValueOnce({
			isDirectory: () => false
		} as Stats);

		await expect(cacheManagement.scan_cache_dir('/fake/dir')).rejects.toThrow('Scan cache expects a directory');
	});

	test('should scan a valid cache directory', async () => {
		vi.mocked(stat).mockResolvedValueOnce({
			isDirectory: () => true
		} as Stats);

		vi.mocked(readdir).mockResolvedValueOnce(['repo1', 'repo2']);

		vi.mocked(stat).mockResolvedValueOnce({ isDirectory: () => true } as any);
		vi.mocked(stat).mockResolvedValueOnce({ isDirectory: () => true } as any);

		vi.spyOn(cacheManagement, 'scan_cached_repo').mockResolvedValueOnce({ repo_id: 'repo1', size_on_disk: 100 } as any);
		vi.spyOn(cacheManagement, 'scan_cached_repo').mockResolvedValueOnce({ repo_id: 'repo2', size_on_disk: 200 } as any);

		const result = await cacheManagement.scan_cache_dir('/fake/dir');

		expect(result.size_on_disk).toBe(300);
		expect(result.repos.size).toBe(2);
	});
});

describe('scan_cached_repo', () => {
	test('should throw an error for invalid repo path', async () => {
		await expect(() => {
			return cacheManagement.scan_cached_repo('/fake/repo_path');
		}).rejects.toThrow('Repo path is not a valid HuggingFace cache directory');
	});

	test('should return CachedRepoInfo for a valid repo', async () => {
		const repoPath = '/fake/model--repo1';

		vi.mocked(stat).mockResolvedValue({ isDirectory: () => true } as unknown as Stats);
		vi.mocked(readdir).mockImplementationOnce(async () => {
				return ['snapshot1', 'snapshot2'] as unknown as ReturnType<typeof readdir>
			}
		);
		vi.spyOn(cacheManagement, 'scanSnapshotDir').mockResolvedValueOnce(undefined);

		const result = await cacheManagement.scan_cached_repo(repoPath);

		expect(result.repo_id).toBe('repo1');
		expect(result.repo_type).toBe(cacheManagement.REPO_TYPE_T.MODEL);
	});
});



describe('scanSnapshotDir', () => {
	test('should scan a valid snapshot directory', async () => {
		const cachedFiles = new Set();
		const blobStats = new Map();
		vi.mocked(readdir).mockResolvedValueOnce([{ name: 'file1', isDirectory: () => false }]);

		vi.mocked(realpath).mockResolvedValueOnce('/fake/realpath');
		vi.mocked(lstat).mockResolvedValueOnce({ size: 1024, atimeMs: Date.now(), mtimeMs: Date.now() } as any);

		await cacheManagement.scanSnapshotDir('/fake/revision', cachedFiles, blobStats);

		expect(cachedFiles.size).toBe(1);
		expect(blobStats.size).toBe(1);
	});
});

describe('getBlobStat', () => {
	test('should retrieve blob stat if already cached', async () => {
		const blobStats = new Map([['/fake/blob', { size: 1024 } as any]]);
		const result = await cacheManagement.getBlobStat('/fake/blob', blobStats);

		expect(result.size).toBe(1024);
	});

	test('should fetch and cache blob stat if not cached', async () => {
		const blobStats = new Map();
		vi.mocked(lstat).mockResolvedValueOnce({ size: 2048 } as any);

		const result = await cacheManagement.getBlobStat('/fake/blob', blobStats);

		expect(result.size).toBe(2048);
		expect(blobStats.size).toBe(1);
	});
});

describe('parseRepoType', () => {
	test('should parse model repo type', () => {
		expect(cacheManagement.parseRepoType('model')).toBe(cacheManagement.REPO_TYPE_T.MODEL);
	});

	test('should parse dataset repo type', () => {
		expect(cacheManagement.parseRepoType('dataset')).toBe(cacheManagement.REPO_TYPE_T.DATASET);
	});

	test('should throw an error for invalid repo type', () => {
		expect(() => cacheManagement.parseRepoType('invalid')).toThrow();
	});
});
