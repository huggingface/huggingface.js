import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		exclude: [...configDefaults.exclude, "src/utils/FileBlob.spec.ts"],
	},
});
