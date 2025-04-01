import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 30_000,
		exclude: [
			...configDefaults.exclude,
			"src/utils/FileBlob.spec.ts",
			"src/utils/symlink.spec.ts",
			"src/lib/cache-management.spec.ts",
			"src/lib/download-file-to-cache-dir.spec.ts",
			"src/lib/snapshot-download.spec.ts",
			// Because we use redirect: "manual" in the test
			"src/lib/oauth-handle-redirect.spec.ts",
		],
	},
});
