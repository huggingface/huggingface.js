import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// make local test files available in browser by preloading their contents
const testFilesToPreload = [
	"cheetah.png",
	"cats.png",
	"sample1.flac",
	"sample2.wav",
	"invoice.png",
	"stormtrooper_depth.png",
	"bird_canny.png",
];
const testFilesContents: Record<string, string> = {};
for (const filename of testFilesToPreload) {
	testFilesContents[filename] = readFileSync(join(__dirname, "test", filename)).toString("base64");
}

export default defineConfig({
	test: {
		setupFiles: ["./test/expect-closeto.ts"],
	},
	envPrefix: ["HF_", "VCR_"],
	define: {
		__TEST_FILES__: JSON.stringify(testFilesContents),
	},
});
