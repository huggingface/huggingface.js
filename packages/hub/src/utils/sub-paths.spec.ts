import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { describe, expect, it } from "vitest";
import { subPaths } from "./sub-paths";
import { pathToFileURL } from "url";

describe("sub-paths", () => {
	it.each([
		{ maxDepth: 0, expectedDepth: 0 },
		{ maxDepth: 1, expectedDepth: 1 },
		{ maxDepth: 2, expectedDepth: 2 },
		{ maxDepth: undefined, expectedDepth: 10 },
	])("should limit traversal to depth $expectedDepth", async ({ maxDepth, expectedDepth }) => {
		const tmpDir = await mkdtemp(`${tmpdir()}/hub-sub-paths-`);

		try {
			const expected = [];
			for (let depth = 0; depth <= 11; depth++) {
				const prefix = "sub/".repeat(depth);
				await mkdir(`${tmpDir}/${prefix}`, { recursive: true });
				await writeFile(`${tmpDir}/${prefix}file.txt`, `file at depth ${depth}`);
				if (depth <= expectedDepth) {
					expected.push({
						path: pathToFileURL(`${tmpDir}/${prefix}file.txt`),
						relativePath: `${prefix}file.txt`,
					});
				}
			}

			expect(await subPaths(pathToFileURL(tmpDir), maxDepth)).toEqual(expected);
		} finally {
			await rm(tmpDir, { recursive: true, force: true });
		}
	});

	it("should retrieve a file when the maximum depth is zero", async () => {
		const tmpDir = await mkdtemp(`${tmpdir()}/hub-sub-paths-`);

		try {
			const path = pathToFileURL(`${tmpDir}/file.txt`);
			await writeFile(path, "file");

			expect(await subPaths(path, 0)).toEqual([{ path, relativePath: "." }]);
		} finally {
			await rm(tmpDir, { recursive: true, force: true });
		}
	});

	it("should retrieve all sub-paths of a directory", async () => {
		const tmpDir = tmpdir();

		await mkdir(`${tmpDir}/test-dir/sub`, { recursive: true });

		await writeFile(`${tmpDir}/test-dir/sub/file1.txt`, "file1");
		await writeFile(`${tmpDir}/test-dir/sub/file2.txt`, "file2");
		await writeFile(`${tmpDir}/test-dir/file3.txt`, "file3");
		await writeFile(`${tmpDir}/test-dir/file4.txt`, "file4");
		const result = await subPaths(pathToFileURL(`${tmpDir}/test-dir`));

		expect(result).toEqual([
			{
				path: pathToFileURL(`${tmpDir}/test-dir/file3.txt`),
				relativePath: "file3.txt",
			},
			{
				path: pathToFileURL(`${tmpDir}/test-dir/file4.txt`),
				relativePath: "file4.txt",
			},

			{
				path: pathToFileURL(`${tmpDir}/test-dir/sub/file1.txt`),
				relativePath: "sub/file1.txt",
			},
			{
				path: pathToFileURL(`${tmpDir}/test-dir/sub/file2.txt`),
				relativePath: "sub/file2.txt",
			},
		]);
	});
});
