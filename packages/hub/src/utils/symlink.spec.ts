/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createSymlink } from "./symlink";
import { readFileSync, writeFileSync } from "node:fs";
import { lstat, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

/**
 * Windows allows symlinks once Developer Mode is on (or with admin rights), so the platform alone
 * doesn't tell us what createSymlink will do: ask the filesystem instead.
 */
async function canCreateSymlinks(): Promise<boolean> {
	const link = join(tmpdir(), "symlink-support-check");
	await rm(link, { force: true });
	try {
		// The target doesn't need to exist, we only care whether the link itself can be created
		await symlink("symlink-support-check-target", link);
		return true;
	} catch {
		return false;
	} finally {
		await rm(link, { force: true });
	}
}

describe("utils/symlink", () => {
	let symlinksSupported = false;
	beforeAll(async () => {
		symlinksSupported = await canCreateSymlinks();
	});

	it("should create a symlink", async () => {
		writeFileSync(join(tmpdir(), "test.txt"), "hello world");
		await createSymlink({
			sourcePath: join(tmpdir(), "test.txt"),
			finalPath: join(tmpdir(), "test-symlink.txt"),
		});

		const stats = await lstat(join(tmpdir(), "test-symlink.txt"));
		expect(stats.isSymbolicLink()).toBe(symlinksSupported);

		// Test file content
		const content = readFileSync(join(tmpdir(), "test-symlink.txt"), "utf8");
		expect(content).toBe("hello world");

		// Cleanup
		await rm(join(tmpdir(), "test-symlink.txt"));
		await rm(join(tmpdir(), "test.txt"));
	});

	it("should work when symlinking twice", async () => {
		writeFileSync(join(tmpdir(), "test.txt"), "hello world");
		writeFileSync(join(tmpdir(), "test2.txt"), "hello world2");
		await createSymlink({
			sourcePath: join(tmpdir(), "test.txt"),
			finalPath: join(tmpdir(), "test-symlink.txt"),
		});
		await createSymlink({
			sourcePath: join(tmpdir(), "test2.txt"),
			finalPath: join(tmpdir(), "test-symlink.txt"),
		});

		const stats = await lstat(join(tmpdir(), "test-symlink.txt"));
		expect(stats.isSymbolicLink()).toBe(symlinksSupported);

		// Test file content
		const content = readFileSync(join(tmpdir(), "test-symlink.txt"), "utf8");
		expect(content).toBe("hello world2");

		// Cleanup
		await rm(join(tmpdir(), "test-symlink.txt"));
		await rm(join(tmpdir(), "test.txt"));
		await rm(join(tmpdir(), "test2.txt"));
	});

	it("should work when symlink doesn't work (windows)", async () => {
		writeFileSync(join(tmpdir(), "test.txt"), "hello world");

		failSymlink = true;
		await createSymlink({
			sourcePath: join(tmpdir(), "test.txt"),
			finalPath: join(tmpdir(), "test-symlink.txt"),
		});

		const stats = await lstat(join(tmpdir(), "test-symlink.txt"));
		expect(stats.isSymbolicLink()).toBe(false);

		// Test file content
		const content = readFileSync(join(tmpdir(), "test-symlink.txt"), "utf8");
		expect(content).toBe("hello world");

		// Cleanup
		await rm(join(tmpdir(), "test-symlink.txt"));
		await rm(join(tmpdir(), "test.txt"));
	});
});
