import { describe, it, expect } from "vitest";
import { TEST_HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../test/consts";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { copyFiles, parseHfCopyHandle } from "./copy-files";
import { listFiles } from "./list-files";
import { commit } from "./commit";

describe("parseHfCopyHandle", () => {
	it("should parse a bucket handle", () => {
		const handle = parseHfCopyHandle("hf://buckets/namespace/bucket-name/path/to/file");
		expect(handle).toEqual({
			type: "bucket",
			bucketId: "namespace/bucket-name",
			path: "path/to/file",
		});
	});

	it("should parse a bucket handle without path", () => {
		const handle = parseHfCopyHandle("hf://buckets/namespace/bucket-name");
		expect(handle).toEqual({
			type: "bucket",
			bucketId: "namespace/bucket-name",
			path: "",
		});
	});

	it("should parse a model repo handle (implicit)", () => {
		const handle = parseHfCopyHandle("hf://username/my-model/weights.bin");
		expect(handle).toEqual({
			type: "repo",
			repoType: "model",
			repoId: "username/my-model",
			revision: "main",
			path: "weights.bin",
		});
	});

	it("should parse a model repo handle (explicit)", () => {
		const handle = parseHfCopyHandle("hf://models/username/my-model/weights.bin");
		expect(handle).toEqual({
			type: "repo",
			repoType: "model",
			repoId: "username/my-model",
			revision: "main",
			path: "weights.bin",
		});
	});

	it("should parse a dataset repo handle", () => {
		const handle = parseHfCopyHandle("hf://datasets/username/my-dataset/data/train.parquet");
		expect(handle).toEqual({
			type: "repo",
			repoType: "dataset",
			repoId: "username/my-dataset",
			revision: "main",
			path: "data/train.parquet",
		});
	});

	it("should parse a space repo handle", () => {
		const handle = parseHfCopyHandle("hf://spaces/username/my-space/app.py");
		expect(handle).toEqual({
			type: "repo",
			repoType: "space",
			repoId: "username/my-space",
			revision: "main",
			path: "app.py",
		});
	});

	it("should parse a handle with revision", () => {
		const handle = parseHfCopyHandle("hf://username/my-model@dev/weights.bin");
		expect(handle).toEqual({
			type: "repo",
			repoType: "model",
			repoId: "username/my-model",
			revision: "dev",
			path: "weights.bin",
		});
	});

	it("should parse a handle with no subpath", () => {
		const handle = parseHfCopyHandle("hf://datasets/username/my-dataset");
		expect(handle).toEqual({
			type: "repo",
			repoType: "dataset",
			repoId: "username/my-dataset",
			revision: "main",
			path: "",
		});
	});

	it("should throw for invalid handle", () => {
		expect(() => parseHfCopyHandle("not-a-hf-handle")).toThrow("Expected a path starting with 'hf://'");
	});

	it("should throw for empty handle", () => {
		expect(() => parseHfCopyHandle("hf://")).toThrow("Invalid HF handle");
	});

	it("should throw for handle with only repo type", () => {
		expect(() => parseHfCopyHandle("hf://models/alone")).toThrow("Invalid repo HF handle");
	});
});

describe("copyFiles", () => {
	it("should reject non-bucket destinations", async () => {
		await expect(
			copyFiles({
				source: "hf://buckets/ns/bucket/file.bin",
				destination: "hf://models/ns/repo/file.bin",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			}),
		).rejects.toThrow("Destination must be a bucket");
	});

	it("should copy files from one bucket to another", async () => {
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

			await copyFiles({
				source: `hf://buckets/${srcBucketName}/test-file.txt`,
				destination: `hf://buckets/${dstBucketName}/`,
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

	it("should copy files from a repo to a bucket", async () => {
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

			await copyFiles({
				source: `hf://models/${srcRepoName}`,
				destination: `hf://buckets/${dstBucketName}/models/test/`,
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

			expect(files.some((f) => f.includes("config.json"))).toBe(true);
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
