import { sveltekit } from "@sveltejs/kit/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isSSR = process.argv.includes("--ssr");

export default defineConfig(({ mode }) => {
	if (mode === "lib") {
		return {
			plugins: [
				svelte({
					configFile: false,
					extensions: [".svelte"],

					// eslint-disable-next-line
					// @ts-ignore see https://github.com/sveltejs/svelte-preprocess/issues/591
					preprocess: sveltePreprocess({
						typescript: { tsconfigFile: `${__dirname}/tsconfig.json` },
					}),
					emitCss: false,
					compilerOptions: {
						hydratable: true,
						generate:   isSSR ? "ssr" : "dom",
					},
				}),
				dts({
					entryRoot: "src/lib",
				}),
			],
			build: {
				manifest: true,
				outDir: `dist/${isSSR ? "server" : "client"}`,
				rollupOptions: {
					input: {
						index: "src/lib/index.ts",
					},
					preserveEntrySignatures: "strict",
					output: [
						{
							preserveModules: true,
							format: "cjs",
							entryFileNames: "[name].cjs",
						},
						{
							preserveModules: true,
							format: "es",
							entryFileNames: "[name].js",
						},
					],
					external: ["svelte", /svelte\/(.*)/, "@huggingface/tasks"],
				},
			},
		};
	}

	if (mode === "app") {
		return {
			plugins: [sveltekit()],
		};
	}

	return {};
});
