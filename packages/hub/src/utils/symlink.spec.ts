/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { createSymlink } from "./symlink";
import { readFileSync, writeFileSync } from "node:fs";
import { lstat, rm } from "node:fs/promises";

let failSymlink = false;
vi.mock("node:fs/promises", async (importOriginal) => ({
	...(await importOriginal<typeof import("node:fs/promises")>()),
	symlink: async (...args: any[]) => {
		if (failSymlink) {
			failSymlink = false;
			throw new Error("Symlink not supported");
		}

		// @ts-expect-error - ignore
		return (await importOriginal<typeof import("node:fs/promises")>()).symlink(...args);
	},
}));

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

	it("should work when symlink doesn't work (windows)", async () => {
		writeFileSync("/tmp/test.txt", "hello world");

		failSymlink = true;
		await createSymlink({
			sourcePath: "/tmp/test.txt",
			finalPath: "/tmp/test-symlink.txt",
		});

		const stats = await lstat("/tmp/test-symlink.txt");
		expect(stats.isSymbolicLink()).toBe(false);

		// Test file content
		const content = readFileSync("/tmp/test-symlink.txt", "utf8");
		expect(content).toBe("hello world");

		// Cleanup
		await rm("/tmp/test-symlink.txt");
		await rm("/tmp/test.txt");
	});
});
