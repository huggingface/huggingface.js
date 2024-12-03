import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		exclude: [
			...configDefaults.exclude,
			"src/utils/FileBlob.spec.ts",
			"src/lib/cache-management.spec.ts",
			"src/lib/download-file-to-cache-dir.spec.ts",
			"src/lib/snapshot-download.spec.ts",
		],
	},
});