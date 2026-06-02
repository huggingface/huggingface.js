import { describe, it, expect } from "vitest";
import { TEST_HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../test/consts";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { copyFile, copyFiles, copyFolder, relativeUnderFolder } from "./copy-files";
import { listFiles } from "./list-files";
import { commit } from "./commit";

describe("relativeUnderFolder", () => {
	it("returns the basename when filePath equals folderPath (single-file folder)", () => {
		expect(relativeUnderFolder("data/train.parquet", "data/train.parquet")).toBe("train.parquet");
	});

	it("returns the path relative to the folder", () => {
		expect(relativeUnderFolder("data/2024/train.parquet", "data")).toBe("2024/train.parquet");
	});

	it("returns the filePath unchanged when folderPath is empty", () => {
		expect(relativeUnderFolder("a/b/c.txt", "")).toBe("a/b/c.txt");
	});

	it("throws when filePath is not under folderPath", () => {
		expect(() => relativeUnderFolder("foo/bar", "baz")).toThrow("not inside folder");
	});
});

describe("copyFiles (mocked)", () => {
	it("rejects copy ops on a non-bucket destination", async () => {
		await expect(
			copyFiles({
				destination: { type: "model", name: "ns/repo" } as never,
				files: [
					{
						source: { repo: { type: "bucket", name: "ns/bucket" }, path: "file.bin" },
						destinationPath: "file.bin",
					},
				],
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: "https://example.invalid",
				fetch: mockFetch({
					"/api/buckets/ns/bucket/paths-info": () =>
						jsonResponse([{ path: "file.bin", type: "file", size: 5, xetHash: "abc123" }]),
				}),
			}),
		).rejects.toThrow("'copy' operations are only supported when the destination repo is a bucket");
	});

	it("throws when the source path is a folder", async () => {
		await expect(
			copyFiles({
				destination: { type: "bucket", name: "ns/dst" },
				files: [
					{
						source: { repo: { type: "model", name: "ns/model" }, path: "data" },
						destinationPath: "data",
					},
				],
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: "https://example.invalid",
				fetch: mockFetch({
					"/api/models/ns/model/paths-info": () => jsonResponse([{ path: "data", type: "directory", size: 0 }]),
				}),
			}),
		).rejects.toThrow("is a folder; use copyFolder()");
	});

	it("throws a clear error when the source file is missing", async () => {
		await expect(
			copyFiles({
				destination: { type: "bucket", name: "ns/dst" },
				files: [
					{
						source: { repo: { type: "model", name: "ns/model" }, path: "missing.txt" },
						destinationPath: "missing.txt",
					},
				],
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: "https://example.invalid",
				fetch: mockFetch({
					"/api/models/ns/model/paths-info": () => jsonResponse([]),
				}),
			}),
		).rejects.toThrow("Source file not found");
	});

	it("refuses to copy unmigrated LFS files and reports their size", async () => {
		await expect(
			copyFiles({
				destination: { type: "bucket", name: "ns/dst" },
				files: [
					{
						source: { repo: { type: "model", name: "ns/model" }, path: "model.safetensors" },
						destinationPath: "model.safetensors",
					},
				],
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: "https://example.invalid",
				fetch: mockFetch({
					"/api/models/ns/model/paths-info": () =>
						jsonResponse([
							{
								path: "model.safetensors",
								type: "file",
								size: 5_300_000_000,
								lfs: { oid: "deadbeef", size: 5_300_000_000, pointerSize: 134 },
							},
						]),
				}),
			}),
		).rejects.toThrow(/LFS file\(s\).*'model\.safetensors' \(5\.30 GB\).*Migrate these files to xet/s);
	});
});

describe("copyFile / copyFiles / copyFolder (integration)", () => {
	it("copies a single file from one bucket to another", async () => {
		const srcBucketName = `${TEST_USER}/TEST-src-${insecureRandomString()}`;
		const dstBucketName = `${TEST_USER}/TEST-dst-${insecureRandomString()}`;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				repo: { name: srcBucketName, type: "bucket" },
				hubUrl: TEST_HUB_URL,
			});

			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				repo: { name: dstBucketName, type: "bucket" },
				hubUrl: TEST_HUB_URL,
			});

			await commit({
				repo: { type: "bucket", name: srcBucketName },
				operations: [
					{
						operation: "addOrUpdate",
						path: "test-file.txt",
						content: new Blob(["hello world"]),
					},
				],
				title: "Add test file",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			await copyFile({
				source: { repo: { type: "bucket", name: srcBucketName }, path: "test-file.txt" },
				destination: { repo: { type: "bucket", name: dstBucketName }, path: "test-file.txt" },
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const files: string[] = [];
			for await (const file of listFiles({
				repo: { type: "bucket", name: dstBucketName },
				recursive: true,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			})) {
				if (file.type === "file") {
					files.push(file.path);
				}
			}

			expect(files).toContain("test-file.txt");
		} finally {
			await deleteRepo({
				repo: { name: srcBucketName, type: "bucket" },
				credentials: { accessToken: TEST_ACCESS_TOKEN },
				hubUrl: TEST_HUB_URL,
			}).catch(() => {});

			await deleteRepo({
				repo: { name: dstBucketName, type: "bucket" },
				credentials: { accessToken: TEST_ACCESS_TOKEN },
				hubUrl: TEST_HUB_URL,
			}).catch(() => {});
		}
	});

	it("copies a folder from a model repo to a bucket", async () => {
		const srcRepoName = `${TEST_USER}/TEST-repo-${insecureRandomString()}`;
		const dstBucketName = `${TEST_USER}/TEST-dst-${insecureRandomString()}`;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				repo: { name: srcRepoName, type: "model" },
				hubUrl: TEST_HUB_URL,
			});

			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				repo: { name: dstBucketName, type: "bucket" },
				hubUrl: TEST_HUB_URL,
			});

			await commit({
				repo: { type: "model", name: srcRepoName },
				operations: [
					{
						operation: "addOrUpdate",
						path: "config.json",
						content: new Blob(['{"model_type": "test"}']),
					},
				],
				title: "Add config",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			await copyFolder({
				source: { repo: { type: "model", name: srcRepoName } },
				destination: {
					repo: { type: "bucket", name: dstBucketName },
					path: "models/test/",
				},
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const files: string[] = [];
			for await (const file of listFiles({
				repo: { type: "bucket", name: dstBucketName },
				recursive: true,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			})) {
				if (file.type === "file") {
					files.push(file.path);
				}
			}

			expect(files).toContain("models/test/config.json");
		} finally {
			await deleteRepo({
				repo: { name: srcRepoName, type: "model" },
				credentials: { accessToken: TEST_ACCESS_TOKEN },
				hubUrl: TEST_HUB_URL,
			}).catch(() => {});

			await deleteRepo({
				repo: { name: dstBucketName, type: "bucket" },
				credentials: { accessToken: TEST_ACCESS_TOKEN },
				hubUrl: TEST_HUB_URL,
			}).catch(() => {});
		}
	});
});

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(body), {
		status: init.status ?? 200,
		headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
	});
}

type MockHandler = (req: Request) => Response | Promise<Response>;

function mockFetch(routes: Record<string, MockHandler>): typeof fetch {
	return async (input, init) => {
		const req = new Request(input as RequestInfo, init);
		const url = new URL(req.url);
		const matched = Object.entries(routes).find(([prefix]) => url.pathname.startsWith(prefix));
		if (!matched) {
			throw new Error(`Unexpected request to ${req.method} ${url.pathname}`);
		}
		return matched[1](req);
	};
}
