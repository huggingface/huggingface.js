import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	envPrefix: ["HF_"],
	test: {
		exclude: [...configDefaults.exclude],
	},
});
