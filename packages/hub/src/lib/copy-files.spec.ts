import { assert, it, describe, expect } from "vitest";

import { TEST_HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../test/consts";
import { insecureRandomString } from "../utils/insecureRandomString";
import { copyFiles, parseHfCopyHandle } from "./copy-files";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { commit } from "./commit";
import { downloadFile } from "./download-file";


describe("parseHfCopyHandle", () => {
	it("parses a bucket handle", () => {
		const handle = parseHfCopyHandle("hf://buckets/user/my-bucket/path/to/file");
		expect(handle).toEqual({
			kind: "bucket",
			bucketId: "user/my-bucket",
			path: "path/to/file",
		});
	});

	it("parses a model repo handle", () => {
		const handle = parseHfCopyHandle("hf://user/my-model/weights.bin");
		expect(handle).toEqual({
			kind: "repo",
			repoType: "model",
			repoId: "user/my-model",
			revision: "main",
			path: "weights.bin",
		});
	});

	it("parses a dataset repo handle with revision", () => {
		const handle = parseHfCopyHandle("hf://datasets/user/my-data@my-branch/data/file.csv");
		expect(handle).toEqual({
			kind: "repo",
			repoType: "dataset",
			repoId: "user/my-data",
			revision: "my-branch",
			path: "data/file.csv",
		});
	});
});

describe("copyFiles", () => {
	it("should copy a file within the same bucket", async () => {
		const bucketName = `${TEST_USER}/TEST-copy-same-bucket-${insecureRandomString()}`;
		const bucket = { type: "bucket" as const, name: bucketName };

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				repo: bucket,
				hubUrl: TEST_HUB_URL,
			});

			// Upload a source file
			await commit({
				accessToken: TEST_ACCESS_TOKEN,
				repo: bucket,
				title: "Add source file",
				hubUrl: TEST_HUB_URL,
				operations: [
					{
						operation: "addOrUpdate" as const,
						path: "source.txt",
						content: new Blob(["bucket-content"]),
					},
				],
			});

			// Copy the file to a new location within the same bucket
			await copyFiles({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				source: `hf://buckets/${bucketName}/source.txt`,
				destination: `hf://buckets/${bucketName}/copied.txt`,
			});

			// Download and verify the copied file
			const copiedBlob = await downloadFile({
				accessToken: TEST_ACCESS_TOKEN,
				repo: bucket,
				path: "copied.txt",
				hubUrl: TEST_HUB_URL,
			});

			assert.strictEqual(await copiedBlob?.text(), "bucket-content");
		} finally {
			await deleteRepo({
				accessToken: TEST_ACCESS_TOKEN,
				repo: bucket,
				hubUrl: TEST_HUB_URL,
			});
		}
	});

	it("should copy multiple files from a folder within the same bucket", async () => {
		const bucketName = `${TEST_USER}/TEST-copy-folder-same-bucket-${insecureRandomString()}`;
		const bucket = { type: "bucket" as const, name: bucketName };

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				repo: bucket,
				hubUrl: TEST_HUB_URL,
			});

			// Upload multiple source files in a folder
			await commit({
				accessToken: TEST_ACCESS_TOKEN,
				repo: bucket,
				title: "Add source files",
				hubUrl: TEST_HUB_URL,
				operations: [
					{
						operation: "addOrUpdate" as const,
						path: "source/a.txt",
						content: new Blob(["content-a"]),
					},
					{
						operation: "addOrUpdate" as const,
						path: "source/b.txt",
						content: new Blob(["content-b"]),
					},
				],
			});

			// Copy the entire folder to a new location
			await copyFiles({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				source: `hf://buckets/${bucketName}/source/`,
				destination: `hf://buckets/${bucketName}/backup/`,
			});

			// Verify both files were copied
			const blobA = await downloadFile({
				accessToken: TEST_ACCESS_TOKEN,
				repo: bucket,
				path: "backup/a.txt",
				hubUrl: TEST_HUB_URL,
			});
			assert.strictEqual(await blobA?.text(), "content-a");

			const blobB = await downloadFile({
				accessToken: TEST_ACCESS_TOKEN,
				repo: bucket,
				path: "backup/b.txt",
				hubUrl: TEST_HUB_URL,
			});
			assert.strictEqual(await blobB?.text(), "content-b");
		} finally {
			await deleteRepo({
				accessToken: TEST_ACCESS_TOKEN,
				repo: bucket,
				hubUrl: TEST_HUB_URL,
			});
		}
	});

	it("should throw when destination is not a bucket", () => {
		expect(
			copyFiles({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				source: "hf://buckets/user/my-bucket/source.txt",
				destination: "hf://user/my-model/destination.txt",
			})
		).rejects.toThrow("Bucket-to-repo and repo-to-repo copy are not supported. Destination must be a bucket.");
	});
});
