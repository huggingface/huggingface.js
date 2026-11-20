import { expect, test, describe, vi, beforeEach, afterEach } from "vitest";
import type { RepoDesignation, RepoId } from "../types/public";
import { dirname, join } from "node:path";
import { lstat, mkdir, stat, symlink, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import type * as fsPromises from "node:fs/promises";
import type * as fsModule from "node:fs";
import { pathsInfo } from "./paths-info";
import { createWriteStream, type Stats } from "node:fs";
import { getHFHubCachePath, getRepoFolderName } from "./cache-management";
import { toRepoId } from "../utils/toRepoId";
import { downloadFileToCacheDir } from "./download-file-to-cache-dir";
import { createSymlink } from "../utils/symlink";

vi.mock("node:fs/promises", async () => ({
	...(await vi.importActual<typeof fsPromises>("node:fs/promises")),
	rename: vi.fn(),
	symlink: vi.fn(),
	lstat: vi.fn(),
	mkdir: vi.fn(),
	stat: vi.fn(),
	rm: vi.fn(),
}));

vi.mock("node:fs", async () => ({
	...(await vi.importActual<typeof fsModule>("node:fs")),
	createWriteStream: vi.fn(),
}));

vi.mock("./paths-info", () => ({
	pathsInfo: vi.fn(),
}));

vi.mock("../utils/symlink", () => ({
	createSymlink: vi.fn(),
}));

const DUMMY_REPO: RepoId = {
	name: "hello-world",
	type: "model",
};

const DUMMY_ETAG = "dummy-etag";

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
			revision: "main",
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
		expect(vi.mocked(mkdir).mock.calls[0][0]).toBe(dirname(expectedBlob));
		expect(vi.mocked(mkdir).mock.calls[1][0]).toBe(dirname(expectPointer));

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

		const incomplete = vi.mocked(createWriteStream).mock.calls[0][0];
		expect(incomplete).toEqual(expect.stringContaining(`${expectedBlob}.`));
		expect(incomplete).toEqual(expect.stringMatching(/\.incomplete$/));
		// 1. should write fetch#response#body to its own incomplete file
		expect(createWriteStream).toHaveBeenCalledWith(incomplete, { flags: "wx" });
		// 2. should rename the incomplete to the blob expected name
		expect(rename).toHaveBeenCalledWith(incomplete, expectedBlob);
		expect(rm).toHaveBeenCalledWith(incomplete, { force: true });
		// 3. should create symlink pointing to blob
		expect(createSymlink).toHaveBeenCalledWith({ sourcePath: expectedBlob, finalPath: expectPointer });
	});
});

describe("downloadFileToCacheDir on disk", () => {
	const revision = "a".repeat(40);
	const etag = "b".repeat(40);
	const content = "cached content\n";
	let fs: typeof fsPromises;
	let cacheDir: string;

	beforeEach(async () => {
		vi.resetAllMocks();
		fs = await vi.importActual<typeof fsPromises>("node:fs/promises");
		vi.mocked(rename).mockImplementation(fs.rename);
		vi.mocked(symlink).mockImplementation(fs.symlink);
		vi.mocked(lstat).mockImplementation(fs.lstat);
		vi.mocked(mkdir).mockImplementation(fs.mkdir);
		vi.mocked(stat).mockImplementation(fs.stat);
		vi.mocked(rm).mockImplementation(fs.rm);
		vi.mocked(createWriteStream).mockImplementation(
			(await vi.importActual<typeof fsModule>("node:fs")).createWriteStream,
		);
		vi.mocked(pathsInfo).mockImplementation(
			(await vi.importActual<{ pathsInfo: typeof pathsInfo }>("./paths-info")).pathsInfo,
		);
		vi.mocked(createSymlink).mockImplementation(
			(await vi.importActual<{ createSymlink: typeof createSymlink }>("../utils/symlink")).createSymlink,
		);
		cacheDir = await fs.mkdtemp(join(tmpdir(), "hf-download-cache-"));
	});

	afterEach(async () => {
		await fs.rm(cacheDir, { recursive: true, force: true });
	});

	function mockHubFetch(download: () => Promise<Response> = async () => new Response(content)) {
		return vi.fn(async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
			const url = new URL(String(input));
			expect(url.origin).toBe("https://hub.invalid");
			if (url.pathname.startsWith("/api/models/hello-world/paths-info/")) {
				const body = JSON.parse(String(init?.body)) as { paths: string[] };
				return new Response(
					JSON.stringify(body.paths.map((path) => ({ path, type: "file", oid: etag, size: content.length }))),
					{ headers: { "Content-Type": "application/json" } },
				);
			}
			expect(url.pathname).toMatch(/^\/hello-world\/resolve\/[a-f0-9]{40}\/.+$/);
			if (new Headers(init?.headers).has("Range")) {
				return new Response(content.slice(0, 1), {
					status: 206,
					headers: { "Content-Range": `bytes 0-0/${content.length}`, ETag: etag },
				});
			}
			return download();
		});
	}

	function download(path: string, fetchMock: typeof fetch, commit = revision) {
		return downloadFileToCacheDir({
			repo: DUMMY_REPO,
			path,
			revision: commit,
			cacheDir,
			hubUrl: "https://hub.invalid",
			fetch: fetchMock,
		});
	}

	test.each([
		{ name: "first writer finishes first", first: 0, interruptSecond: false },
		{ name: "second writer finishes first", first: 1, interruptSecond: false },
		{ name: "interrupted writer preserves the other download", first: 0, interruptSecond: true },
	])("concurrent downloads sharing a blob: $name", async ({ first, interruptSecond }) => {
		const prefixes = [content.slice(0, 4), ""];
		const controllers: ReadableStreamDefaultController<Uint8Array>[] = [];
		const encoder = new TextEncoder();
		const streams = prefixes.map(
			(prefix, index) =>
				new ReadableStream<Uint8Array>({
					start(controller) {
						controllers[index] = controller;
						if (prefix) {
							controller.enqueue(encoder.encode(prefix));
						}
					},
				}),
		);
		let started = 0;
		const fetchMock = mockHubFetch(async () => new Response(streams[started++]));
		const downloads: Promise<string>[] = [];
		const blobs = join(cacheDir, getRepoFolderName(DUMMY_REPO), "blobs");
		async function waitForPartial(partial: string) {
			await vi.waitFor(
				async () => {
					const temporaryFiles = (await fs.readdir(blobs)).filter((file) => file.endsWith(".incomplete"));
					const contents = await Promise.all(temporaryFiles.map((file) => fs.readFile(join(blobs, file), "utf8")));
					expect(contents).toContain(partial);
				},
				{ timeout: 5_000 },
			);
		}
		function finish(index: number) {
			controllers[index].enqueue(encoder.encode(content.slice(prefixes[index].length)));
			controllers[index].close();
		}
		try {
			downloads.push(download("README.md", fetchMock));
			await waitForPartial(prefixes[0]);
			downloads.push(download("README.md", fetchMock, "c".repeat(40)));
			// Observe the second file being opened before completing either HTTP body.
			await waitForPartial(prefixes[1]);
			expect(started).toBe(2);
			if (interruptSecond) {
				controllers[1].error(new Error("download interrupted"));
				await expect(downloads[1]).rejects.toThrow("download interrupted");
			}
			finish(first);
			const pointer = await downloads[first];
			// The returned path must contain the full file even while the other stream is open.
			expect(await fs.readFile(pointer, "utf8")).toBe(content);
			if (!interruptSecond) {
				finish(1 - first);
				const other = await downloads[1 - first];
				expect(await fs.readFile(other, "utf8")).toBe(content);
				const calls = fetchMock.mock.calls.length;
				await download("README.md", fetchMock);
				await download("README.md", fetchMock, "c".repeat(40));
				expect(fetchMock).toHaveBeenCalledTimes(calls);
			}
			expect(await fs.readFile(join(blobs, etag), "utf8")).toBe(content);
			expect(await fs.readdir(blobs)).toEqual([etag]);
		} finally {
			for (const controller of controllers) {
				controller.error(new Error("test cleanup"));
			}
			await Promise.allSettled(downloads);
		}
	});

	test("still links the snapshot when a later rename loses to the published blob", async () => {
		const realRename = fs.rename;
		let blobRenames = 0;
		vi.mocked(rename).mockImplementation(async (from, to) => {
			if (String(to).endsWith(etag)) {
				blobRenames += 1;
				if (blobRenames > 1) {
					throw Object.assign(new Error("EPERM: file in use"), { code: "EPERM" });
				}
			}
			return realRename(from, to);
		});
		const prefixes = [content.slice(0, 4), ""];
		const controllers: ReadableStreamDefaultController<Uint8Array>[] = [];
		const encoder = new TextEncoder();
		const streams = prefixes.map(
			(prefix, index) =>
				new ReadableStream<Uint8Array>({
					start(controller) {
						controllers[index] = controller;
						if (prefix) {
							controller.enqueue(encoder.encode(prefix));
						}
					},
				}),
		);
		let started = 0;
		const bodies = mockHubFetch(async () => new Response(streams[started++]));
		const blobs = join(cacheDir, getRepoFolderName(DUMMY_REPO), "blobs");
		async function waitForPartial(partial: string) {
			await vi.waitFor(
				async () => {
					const temporaryFiles = (await fs.readdir(blobs)).filter((file) => file.endsWith(".incomplete"));
					const contents = await Promise.all(temporaryFiles.map((file) => fs.readFile(join(blobs, file), "utf8")));
					expect(contents).toContain(partial);
				},
				{ timeout: 5_000 },
			);
		}
		const downloads: Promise<string>[] = [];
		try {
			downloads.push(download("README.md", bodies));
			await waitForPartial(prefixes[0]);
			downloads.push(download("README.md", bodies, "c".repeat(40)));
			await waitForPartial(prefixes[1]);
			controllers[0].enqueue(encoder.encode(content.slice(prefixes[0].length)));
			controllers[0].close();
			const first = await downloads[0];
			controllers[1].enqueue(encoder.encode(content.slice(prefixes[1].length)));
			controllers[1].close();
			const second = await downloads[1];
			expect(blobRenames).toBe(2);
			expect(await fs.readFile(first, "utf8")).toBe(content);
			expect(await fs.readFile(second, "utf8")).toBe(content);
		} finally {
			for (const controller of controllers) {
				try {
					controller.error(new Error("test cleanup"));
				} catch {
					// already closed
				}
			}
			await Promise.allSettled(downloads);
		}
	});

	test("reuses a completed blob for another revision without downloading it again", async () => {
		const fetchMock = mockHubFetch();
		const first = await download("README.md", fetchMock);
		const calls = fetchMock.mock.calls.length;
		const second = await download("README.md", fetchMock, "c".repeat(40));
		expect(first).not.toBe(second);
		expect(await fs.readFile(first, "utf8")).toBe(content);
		expect(await fs.readFile(second, "utf8")).toBe(content);
		// Only paths-info is needed to reuse the content-addressed blob.
		expect(fetchMock).toHaveBeenCalledTimes(calls + 1);
	});

	test("removes an interrupted download's temporary file and allows a retry", async () => {
		const fetchMock = mockHubFetch(
			async () =>
				new Response(
					new ReadableStream({
						start(controller) {
							controller.error(new Error("download interrupted"));
						},
					}),
				),
		);
		await expect(download("README.md", fetchMock)).rejects.toThrow("download interrupted");
		const blobs = join(cacheDir, getRepoFolderName(DUMMY_REPO), "blobs");
		expect(await fs.readdir(blobs)).toEqual([]);
		const pointer = await download("README.md", mockHubFetch());
		expect(await fs.readFile(pointer, "utf8")).toBe(content);
		expect(await fs.readdir(blobs)).toEqual([etag]);
	});
});
