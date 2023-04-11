import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// make local test files available in browser by preloading their contents
const testFilesToPreload = ["cheetah.png", "cats.png", "sample1.flac"];
const testFilesContents: Record<string, string> = {};
for (const filename of testFilesToPreload) {
	testFilesContents[filename] = readFileSync(join(__dirname, "test", filename)).toString("base64");
}

export default defineConfig({
	define: {
		__TEST_FILES__: JSON.stringify(testFilesContents),
		// make sure browser receives env vars
		"process.env.HF_ACCESS_TOKEN": JSON.stringify(process.env.HF_ACCESS_TOKEN),
		"process.env.VCR_MODE": JSON.stringify(process.env.VCR_MODE),
	},
});
