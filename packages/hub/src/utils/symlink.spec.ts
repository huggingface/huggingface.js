/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { createSymlink } from "./symlink";
import { readFileSync, writeFileSync } from "node:fs";
import { lstat, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import type * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let failedSymlinks = 0;
let renameSnapshot: typeof fs.rename | undefined;
vi.mock("node:fs/promises", async (importOriginal) => ({
	...(await importOriginal<typeof import("node:fs/promises")>()),
	symlink: async (...args: any[]) => {
		if (failedSymlinks > 0) {
			failedSymlinks -= 1;
			throw new Error("Symlink not supported");
		}

		// @ts-expect-error - ignore
		return (await importOriginal<typeof import("node:fs/promises")>()).symlink(...args);
	},
	rename: async (...args: Parameters<typeof fs.rename>) =>
		(renameSnapshot ?? (await importOriginal<typeof fs>()).rename)(...args),
}));

describe("utils/symlink", () => {
	it("should create a symlink", async () => {
		writeFileSync(join(tmpdir(), "test.txt"), "hello world");
		await createSymlink({
			sourcePath: join(tmpdir(), "test.txt"),
			finalPath: join(tmpdir(), "test-symlink.txt"),
		});

		const stats = await lstat(join(tmpdir(), "test-symlink.txt"));
		expect(stats.isSymbolicLink()).toBe(process.platform !== "win32");

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
		expect(stats.isSymbolicLink()).toBe(process.platform !== "win32");

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

		failedSymlinks = 1;
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
	it("publishes only completed fallback copies when concurrent cache writers share a destination", async () => {
		const dir = await mkdtemp(join(tmpdir(), "hf-cache-snapshot-"));
		const sourcePath = join(dir, "blob");
		const finalPath = join(dir, "snapshot");
		writeFileSync(sourcePath, "completed blob");
		const actualFs = await vi.importActual<typeof fs>("node:fs/promises");
		const staged = new Set<string>();
		let published: Promise<void> | undefined;

		failedSymlinks = 2;
		renameSnapshot = async (from, to) => {
			staged.add(String(from));
			if (published) {
				await published;
				throw Object.assign(new Error("destination in use"), { code: "EPERM" });
			}
			published = (async () => {
				await expect(lstat(to)).rejects.toMatchObject({ code: "ENOENT" });
				expect(await readFile(from, "utf8")).toBe("completed blob");
				await actualFs.rename(from, to);
			})();
			await published;
		};

		try {
			const pointer = { sourcePath, finalPath, reuseExisting: true };
			await Promise.all([createSymlink(pointer), createSymlink(pointer)]);
			expect(staged.size).toBe(2);
			expect(await readFile(finalPath, "utf8")).toBe("completed blob");
			expect((await readdir(dir)).sort()).toEqual(["blob", "snapshot"]);
		} finally {
			failedSymlinks = 0;
			renameSnapshot = undefined;
			await rm(dir, { recursive: true, force: true });
		}
	});
});
