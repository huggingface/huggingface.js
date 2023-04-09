import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export default defineConfig({
	define: {
		__TEST_FILES__: JSON.stringify({
			"cheetah.png": readFileSync(join(__dirname, "test", "cheetah.png")).toString("base64"),
		}),
	},
});
