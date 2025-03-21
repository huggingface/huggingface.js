import { describe, expect, it } from "vitest";
import { createSymlink } from "./symlink";
import { readFileSync, writeFileSync } from "node:fs";
import { lstat } from "node:fs/promises";

describe("utils/symlink", () => {
	it("should create a symlink", async () => {
		writeFileSync("/tmp/test.txt", "hello world");
		await createSymlink({
			sourcePath: "/tmp/test.txt",
			finalPath: "/tmp/test-symlink.txt",
		});

		const stats = await lstat("/tmp/test-symlink.txt");
		expect(stats.isSymbolicLink()).toBe(true);

		// Test file content
		const content = readFileSync("/tmp/test-symlink.txt", "utf8");
		expect(content).toBe("hello world");
	});
});
