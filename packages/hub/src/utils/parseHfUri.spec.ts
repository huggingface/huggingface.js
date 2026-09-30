import { describe, expect, it } from "vitest";
import { parseHfUri } from "./parseHfUri";

describe("parseHfUri", () => {
	it("parses repos with type prefix, revision and path", () => {
		expect(parseHfUri("hf://my-org/my-model")).toEqual({ type: "model", id: "my-org/my-model", path: "" });
		expect(parseHfUri("hf://datasets/my-org/ds/data/train.json")).toEqual({
			type: "dataset",
			id: "my-org/ds",
			path: "data/train.json",
		});
		expect(parseHfUri("hf://datasets/my-org/ds@refs/pr/3/train.json")).toEqual({
			type: "dataset",
			id: "my-org/ds",
			revision: "refs/pr/3",
			path: "train.json",
		});
		expect(parseHfUri("hf://my-org/m@v1/a/b.txt")).toEqual({
			type: "model",
			id: "my-org/m",
			revision: "v1",
			path: "a/b.txt",
		});
		expect(parseHfUri("hf://my-org/m/dir/file@1.txt").revision).toBeUndefined();
	});

	it("parses buckets", () => {
		expect(parseHfUri("hf://buckets/u/b/logs/")).toEqual({ type: "bucket", id: "u/b", path: "logs" });
		expect(parseHfUri("hf://buckets/u/b")).toEqual({ type: "bucket", id: "u/b", path: "" });
	});

	it("rejects invalid URIs", () => {
		expect(() => parseHfUri("u/b")).toThrow(TypeError);
		expect(() => parseHfUri("hf://bucket/u/b")).toThrow(/plural/);
		expect(() => parseHfUri("hf://buckets/u")).toThrow(TypeError);
		expect(() => parseHfUri("hf://buckets")).toThrow(TypeError);
	});
});
