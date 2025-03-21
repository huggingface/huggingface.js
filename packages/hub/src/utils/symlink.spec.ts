import { describe, expect, it } from "vitest";
import { createSymlink } from "./symlink";
import { readFileSync, writeFileSync } from "node:fs";
import { lstat, rm } from "node:fs/promises";

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

		// Cleanup
		await rm("/tmp/test-symlink.txt");
		await rm("/tmp/test.txt");
	});

	it("should work when symlinking twice", async () => {
		writeFileSync("/tmp/test.txt", "hello world");
		writeFileSync("/tmp/test2.txt", "hello world2");
		await createSymlink({
			sourcePath: "/tmp/test.txt",
			finalPath: "/tmp/test-symlink.txt",
		});
		await createSymlink({
			sourcePath: "/tmp/test2.txt",
			finalPath: "/tmp/test-symlink.txt",
		});

		const stats = await lstat("/tmp/test-symlink.txt");
		expect(stats.isSymbolicLink()).toBe(true);

		// Test file content
		const content = readFileSync("/tmp/test-symlink.txt", "utf8");
		expect(content).toBe("hello world2");

		// Cleanup
		await rm("/tmp/test-symlink.txt");
		await rm("/tmp/test.txt");
		await rm("/tmp/test2.txt");
	});
});
