import { readdir, stat } from "node:fs/promises";

/**
 * Recursively retrieves all sub-paths of a given directory up to a specified depth.
 */
export async function subPaths(path: URL, maxDepth = 10): Promise<URL[]> {
	const state = await stat(path);
	if (!state.isDirectory()) {
		return [path];
	}

	const files = await readdir(path, { withFileTypes: true });
	const ret: URL[] = [];
	for (const file of files) {
		const filePath = new URL(file.name, path);
		if (file.isDirectory()) {
			ret.push(...(await subPaths(filePath, maxDepth - 1)));
		} else {
			ret.push(filePath);
		}
	}

	return ret;
}
