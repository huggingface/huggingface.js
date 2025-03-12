import { describe, test, expect, vi, beforeEach } from "vitest";
import * as fs from "node:fs/promises";
import { createSymlink, reset } from "./symlink";
import * as path from "node:path";
import { FileHandle } from "node:fs/promises";

vi.mock("node:fs/promises", () => ({
	rm: vi.fn(),
	symlink: vi.fn(),
	rename: vi.fn(),
	copyFile: vi.fn(),
	mkdir: vi.fn(),
	mkdtemp: vi.fn(),
	open: vi.fn(),
}));

vi.mock("node:os", () => ({
	platform: vi.fn(),
}));

describe("createSymlink", () => {
	const src = "/path/to/src";
	const dst = "/path/to/dst";

	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(fs.mkdtemp).mockImplementation(async (prefix) => `${prefix}/temp`);
		vi.mocked(fs.open).mockResolvedValue({ close: vi.fn() } as unknown as FileHandle);
		reset();
	});

	test("should remove existing destination", async () => {
		await createSymlink(dst, src);
		expect(fs.rm).toHaveBeenCalledWith(dst);
	});

	describe("symlink not supported (Windows)", () => {
		beforeEach(() => {
			vi.mocked(fs.symlink).mockRejectedValue(new Error("Symlink not supported"));
		});

		test("should copyfile", async () => {
			await createSymlink(dst, src);
			expect(fs.copyFile).toHaveBeenCalledWith(path.resolve(src), path.resolve(dst));
		});

		test("should rename file if new_blob is true", async () => {
			await createSymlink(dst, src, true);
			expect(fs.rename).toHaveBeenCalledWith(path.resolve(src), path.resolve(dst));
		});
	});

	describe("symlink supported", () => {
		test("should symlink", async () => {
			await createSymlink(dst, src);
			expect(fs.symlink).toHaveBeenCalledWith(path.resolve(dst), "src");
		});

		test("should symlink if new_blob is true", async () => {
			await createSymlink(dst, src, true);
			expect(fs.symlink).toHaveBeenCalledWith(path.resolve(dst), "src");
		});
	});
});
