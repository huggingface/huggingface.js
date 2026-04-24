import { describe, it, expect } from "vitest";
import { parseHfCopyHandle } from "./copy-files";

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
