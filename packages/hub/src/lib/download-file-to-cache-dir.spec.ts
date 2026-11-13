import { expect, test, describe, vi, beforeEach } from "vitest";
import type { RepoDesignation, RepoId } from "../types/public";
import { dirname, join } from "node:path";
import { lstat, mkdir, readFile, stat, symlink, rename, writeFile } from "node:fs/promises";
import { pathsInfo } from "./paths-info";
import { modelInfo } from "./model-info";
import { createWriteStream, type Stats } from "node:fs";
import { getHFHubCachePath, getRepoFolderName } from "./cache-management";
import { toRepoId } from "../utils/toRepoId";
import { downloadFileToCacheDir } from "./download-file-to-cache-dir";
import { createSymlink } from "../utils/symlink";

vi.mock("node:fs/promises", () => ({
	rename: vi.fn(),
	symlink: vi.fn(),
	lstat: vi.fn(),
	mkdir: vi.fn(),
	stat: vi.fn(),
	readFile: vi.fn(),
	writeFile: vi.fn(),
}));

vi.mock("node:fs", () => ({
	createWriteStream: vi.fn(),
}));

vi.mock("./paths-info", () => ({
	pathsInfo: vi.fn(),
}));

vi.mock("./model-info", () => ({
	modelInfo: vi.fn(),
}));

vi.mock("../utils/symlink", () => ({
	createSymlink: vi.fn(),
}));

const DUMMY_REPO: RepoId = {
	name: "hello-world",
	type: "model",
};

const DUMMY_ETAG = "dummy-etag";
// the commit "main" points to
const DUMMY_COMMIT = "dummy-commit-hash";

// utility test method to get blob file path
function _getBlobFile(params: {
	repo: RepoDesignation;
	etag: string;
	cacheDir?: string; // default to {@link getHFHubCache}
}) {
	return join(params.cacheDir ?? getHFHubCachePath(), getRepoFolderName(toRepoId(params.repo)), "blobs", params.etag);
}

// utility test method to get snapshot file path
function _getSnapshotFile(params: {
	repo: RepoDesignation;
	path: string;
	revision: string;
	cacheDir?: string; // default to {@link getHFHubCache}
}) {
	return join(
		params.cacheDir ?? getHFHubCachePath(),
		getRepoFolderName(toRepoId(params.repo)),
		"snapshots",
		params.revision,
		params.path,
	);
}

describe("downloadFileToCacheDir", () => {
	const fetchMock: typeof fetch = vi.fn();
	beforeEach(() => {
		vi.resetAllMocks();
		// mock 200 request
		vi.mocked(fetchMock).mockResolvedValue(
			new Response("dummy-body", {
				status: 200,
				headers: {
					etag: DUMMY_ETAG,
					"Content-Range": "bytes 0-54/55",
				},
			}),
		);

		vi.mocked(modelInfo).mockResolvedValue({ sha: DUMMY_COMMIT } as Awaited<ReturnType<typeof modelInfo>>);

		// prevent to use caching
		vi.mocked(stat).mockRejectedValue(new Error("Do not exists"));
		vi.mocked(lstat).mockRejectedValue(new Error("Do not exists"));
	});

	test("should reject a path escaping the cache dir", async () => {
		for (const path of ["../evil", "a\\..\\..\\evil", "C:\\Windows\\evil", "\\\\attacker\\share\\evil"]) {
			await expect(
				downloadFileToCacheDir({
					repo: DUMMY_REPO,
					path,
					fetch: fetchMock,
				}),
			).rejects.toThrowError(/Invalid filename/);
		}
		// rejected before any network call or filesystem write
		expect(pathsInfo).not.toHaveBeenCalled();
		expect(createSymlink).not.toHaveBeenCalled();
	});

	test("should throw an error if fileDownloadInfo return nothing", async () => {
		await expect(async () => {
			await downloadFileToCacheDir({
				repo: DUMMY_REPO,
				path: "README.md",
				fetch: fetchMock,
			});
		}).rejects.toThrowError("cannot get path info for README.md");

		expect(pathsInfo).toHaveBeenCalledWith(
			expect.objectContaining({
				repo: DUMMY_REPO,
				paths: ["README.md"],
				fetch: fetchMock,
			}),
		);
	});

	test("existing symlinked and blob should not re-download it", async () => {
		// <cache>/<repo>/<revision>/snapshots/README.md
		const expectPointer = _getSnapshotFile({
			repo: DUMMY_REPO,
			path: "README.md",
			revision: "dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7",
		});
		// stat ensure a symlink and the pointed file exists
		vi.mocked(stat).mockResolvedValue({} as Stats); // prevent default mocked reject

		const output = await downloadFileToCacheDir({
			repo: DUMMY_REPO,
			path: "README.md",
			fetch: fetchMock,
			revision: "dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7",
		});

		expect(stat).toHaveBeenCalledOnce();
		// Get call argument for stat
		const starArg = vi.mocked(stat).mock.calls[0][0];

		expect(starArg).toBe(expectPointer);
		expect(fetchMock).not.toHaveBeenCalledWith();

		expect(output).toBe(expectPointer);
	});

	test("existing symlinked and blob with default revision should not re-download it", async () => {
		// <cache>/<repo>/<revision>/snapshots/README.md
		const expectPointer = _getSnapshotFile({
			repo: DUMMY_REPO,
			path: "README.md",
			revision: DUMMY_COMMIT,
		});
		// stat ensure a symlink and the pointed file exists
		vi.mocked(stat).mockResolvedValue({} as Stats); // prevent default mocked reject
		vi.mocked(lstat).mockResolvedValue({} as Stats);
		vi.mocked(pathsInfo).mockResolvedValue([
			{
				oid: DUMMY_ETAG,
				size: 55,
				path: "README.md",
				type: "file",
				lastCommit: {
					date: new Date(),
					id: "main",
					title: "Commit msg",
				},
			},
		]);

		const output = await downloadFileToCacheDir({
			repo: DUMMY_REPO,
			path: "README.md",
			fetch: fetchMock,
		});

		expect(stat).toHaveBeenCalledOnce();
		expect(symlink).not.toHaveBeenCalledOnce();
		// Get call argument for stat
		const starArg = vi.mocked(stat).mock.calls[0][0];

		expect(starArg).toBe(expectPointer);
		expect(fetchMock).not.toHaveBeenCalledWith();

		expect(output).toBe(expectPointer);
	});

	test("existing blob should only create the symlink", async () => {
		// <cache>/<repo>/<revision>/snapshots/README.md
		const expectPointer = _getSnapshotFile({
			repo: DUMMY_REPO,
			path: "README.md",
			revision: "dummy-commit-hash",
		});
		// <cache>/<repo>/blobs/<etag>
		const expectedBlob = _getBlobFile({
			repo: DUMMY_REPO,
			etag: DUMMY_ETAG,
		});

		// mock existing blob only no symlink
		vi.mocked(lstat).mockResolvedValue({} as Stats);
		// mock pathsInfo resolve content
		vi.mocked(pathsInfo).mockResolvedValue([
			{
				oid: DUMMY_ETAG,
				size: 55,
				path: "README.md",
				type: "file",
				lastCommit: {
					date: new Date(),
					id: "dummy-commit-hash",
					title: "Commit msg",
				},
			},
		]);

		const output = await downloadFileToCacheDir({
			repo: DUMMY_REPO,
			path: "README.md",
			fetch: fetchMock,
		});

		// should have check for the blob
		expect(lstat).toHaveBeenCalled();
		expect(vi.mocked(lstat).mock.calls[0][0]).toBe(expectedBlob);

		// symlink should have been created
		expect(createSymlink).toHaveBeenCalledOnce();
		// no download done
		expect(fetchMock).not.toHaveBeenCalled();

		expect(output).toBe(expectPointer);
	});

	test("expect resolve value to be the pointer path of downloaded file", async () => {
		// <cache>/<repo>/<revision>/snapshots/README.md
		const expectPointer = _getSnapshotFile({
			repo: DUMMY_REPO,
			path: "README.md",
			revision: "dummy-commit-hash",
		});
		// <cache>/<repo>/blobs/<etag>
		const expectedBlob = _getBlobFile({
			repo: DUMMY_REPO,
			etag: DUMMY_ETAG,
		});

		vi.mocked(pathsInfo).mockResolvedValue([
			{
				oid: DUMMY_ETAG,
				size: 55,
				path: "README.md",
				type: "file",
				lastCommit: {
					date: new Date(),
					id: "dummy-commit-hash",
					title: "Commit msg",
				},
			},
		]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(createWriteStream).mockReturnValue(async function* () {} as any);

		const output = await downloadFileToCacheDir({
			repo: DUMMY_REPO,
			path: "README.md",
			fetch: fetchMock,
		});

		// expect blobs and snapshots folder to have been mkdir
		expect(mkdir).toHaveBeenCalledWith(dirname(expectedBlob), { recursive: true });
		expect(mkdir).toHaveBeenCalledWith(dirname(expectPointer), { recursive: true });

		expect(output).toBe(expectPointer);
	});

	test("should write fetch response to blob", async () => {
		// <cache>/<repo>/<revision>/snapshots/README.md
		const expectPointer = _getSnapshotFile({
			repo: DUMMY_REPO,
			path: "README.md",
			revision: "dummy-commit-hash",
		});
		// <cache>/<repo>/blobs/<etag>
		const expectedBlob = _getBlobFile({
			repo: DUMMY_REPO,
			etag: DUMMY_ETAG,
		});

		// mock pathsInfo resolve content
		vi.mocked(pathsInfo).mockResolvedValue([
			{
				oid: DUMMY_ETAG,
				size: 55,
				path: "README.md",
				type: "file",
				lastCommit: {
					date: new Date(),
					id: "dummy-commit-hash",
					title: "Commit msg",
				},
			},
		]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(createWriteStream).mockReturnValue(async function* () {} as any);

		await downloadFileToCacheDir({
			repo: DUMMY_REPO,
			path: "README.md",
			fetch: fetchMock,
		});

		const incomplete = `${expectedBlob}.incomplete`;
		// 1. should write fetch#response#body to incomplete file
		expect(createWriteStream).toHaveBeenCalledWith(incomplete);
		// 2. should rename the incomplete to the blob expected name
		expect(rename).toHaveBeenCalledWith(incomplete, expectedBlob);
		// 3. should create symlink pointing to blob
		expect(createSymlink).toHaveBeenCalledWith({ sourcePath: expectedBlob, finalPath: expectPointer });
	});

	test("files of a branch go under the snapshot of the commit the branch points to", async () => {
		// both blobs are already cached, only the snapshot pointers are created
		vi.mocked(lstat).mockResolvedValue({} as Stats);
		// each file was last changed by a different, older commit
		for (const [path, lastCommitId] of [
			["config.json", "older-commit-1"],
			["README.md", "older-commit-2"],
		]) {
			vi.mocked(pathsInfo).mockResolvedValueOnce([
				{
					oid: DUMMY_ETAG,
					size: 55,
					path,
					type: "file",
					lastCommit: { date: new Date(), id: lastCommitId, title: "Commit msg" },
				},
			]);
		}

		const config = await downloadFileToCacheDir({ repo: DUMMY_REPO, path: "config.json", fetch: fetchMock });
		const readme = await downloadFileToCacheDir({ repo: DUMMY_REPO, path: "README.md", fetch: fetchMock });

		expect(config).toBe(_getSnapshotFile({ repo: DUMMY_REPO, path: "config.json", revision: DUMMY_COMMIT }));
		expect(readme).toBe(_getSnapshotFile({ repo: DUMMY_REPO, path: "README.md", revision: DUMMY_COMMIT }));
		// refs/main records the commit, as huggingface_hub does
		expect(writeFile).toHaveBeenCalledWith(
			join(getHFHubCachePath(), getRepoFolderName(DUMMY_REPO), "refs", "main"),
			DUMMY_COMMIT,
		);
		expect(modelInfo).toHaveBeenCalledWith(expect.objectContaining({ name: DUMMY_REPO.name, revision: "main" }));
		// the file metadata is read at that same commit
		expect(pathsInfo).toHaveBeenNthCalledWith(1, expect.objectContaining({ revision: DUMMY_COMMIT }));
		expect(pathsInfo).toHaveBeenNthCalledWith(2, expect.objectContaining({ revision: DUMMY_COMMIT }));
	});

	test("a cached branch file is returned from a read-only cache", async () => {
		const expectPointer = _getSnapshotFile({ repo: DUMMY_REPO, path: "README.md", revision: DUMMY_COMMIT });
		// blob and snapshot pointer are already cached
		vi.mocked(stat).mockResolvedValue({} as Stats);
		vi.mocked(lstat).mockResolvedValue({} as Stats);
		// refs/main is missing and the cache cannot be written
		vi.mocked(readFile).mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
		vi.mocked(writeFile).mockRejectedValue(Object.assign(new Error("EROFS"), { code: "EROFS" }));

		const output = await downloadFileToCacheDir({ repo: DUMMY_REPO, path: "README.md", fetch: fetchMock });

		expect(output).toBe(expectPointer);
		expect(pathsInfo).not.toHaveBeenCalled();
	});

	test("refs/<revision> is not rewritten when it already holds the commit", async () => {
		vi.mocked(stat).mockResolvedValue({} as Stats);
		vi.mocked(lstat).mockResolvedValue({} as Stats);
		vi.mocked(readFile).mockResolvedValue(DUMMY_COMMIT);

		await downloadFileToCacheDir({ repo: DUMMY_REPO, path: "README.md", fetch: fetchMock });

		expect(writeFile).not.toHaveBeenCalled();
	});
});
