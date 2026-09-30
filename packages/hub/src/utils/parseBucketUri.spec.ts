import { describe, expect, it } from "vitest";
import { parseBucketUri } from "./parseBucketUri";

describe("parseBucketUri", () => {
	it("returns undefined for non hf:// inputs", () => {
		expect(parseBucketUri("./file.txt")).toBeUndefined();
		expect(parseBucketUri("-")).toBeUndefined();
	});

	it("parses bucket with and without path", () => {
		expect(parseBucketUri("hf://buckets/user/b")).toEqual({ bucket: "user/b", path: "" });
		expect(parseBucketUri("hf://buckets/user/b/")).toEqual({ bucket: "user/b", path: "" });
		expect(parseBucketUri("hf://buckets/user/b/a/c.json")).toEqual({ bucket: "user/b", path: "a/c.json" });
		expect(parseBucketUri("hf://buckets/user/b/logs/")).toEqual({ bucket: "user/b", path: "logs/" });
	});

	it("rejects non-bucket and incomplete URIs", () => {
		expect(() => parseBucketUri("hf://datasets/user/d/x")).toThrow(TypeError);
		expect(() => parseBucketUri("hf://buckets/user")).toThrow(TypeError);
	});
});
