// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		includeSource: ["scripts/generate-snippets-fixtures.ts"],
	},
});
