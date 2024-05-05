import type { Options } from "tsup";

const baseConfig: Options = {
	entry: ["./index.ts"],
	format: ["cjs", "esm"],
	outDir: "dist",
	clean: true,
	dts: {
		resolve: true,
	},
};

const nodeConfig: Options = {
	...baseConfig,
	platform: "node",
};

const browserConfig: Options = {
	...baseConfig,
	platform: "browser",
	target: "es2018",
	splitting: true,
	outDir: "dist/browser",
	// We specify external libs only to be able to build. We're not using them on browser.
	external: ["node:fs"],
};

export default [nodeConfig, browserConfig];
