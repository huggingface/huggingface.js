import type { OutputOptions } from 'rollup';
import { sveltekit } from "@sveltejs/kit/vite";
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import { defineConfig } from "vite";

const formats = ['es', 'cjs'];

const isSSR = process.argv.includes('--ssr')

export default defineConfig( ({mode}) => {
	if (mode === 'lib') {
		return {
			plugins: [svelte({
				configFile: false,
				extensions: ['.svelte'],
				preprocess: sveltePreprocess({
					typescript: { tsconfigFile: `${__dirname}/tsconfig.json` },
				}) ,
				emitCss: false,
			})],
			build: {
				manifest: true,
				outDir: `dist/${isSSR ? 'server' : 'client'}`,
				rollupOptions: {
					input: {
						index: 'src/lib/index.ts',
					},
					preserveEntrySignatures: true,
					output: formats.map(format => ({
						preserveModules: true,
						format: format,
						entryFileNames: `[name].${format === 'cjs' ? 'cjs' : 'js'}`,
					})) as OutputOptions[],
					external: ['svelte', /svelte\/(.*)/, "@huggingface/tasks"],
				}
			},  
		}
	}
	
	if (mode === 'app') {
		return {
			plugins: [sveltekit()],
		}
	}

	return {};
});
