import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
	},
	resolve: {
		alias: {
			"@huggingface/splitmix64-wasm": "./node_modules/@huggingface/splitmix64-wasm/build/release.js",
		},
	},
});
