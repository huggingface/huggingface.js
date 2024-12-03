import type { Options } from "tsup";

const baseConfig: Options = {
	entry: ["./index.ts"],
	format: ["cjs", "esm"],
	outDir: "dist",
	clean: true,
};

const nodeConfig: Options = {
	...baseConfig,
	entry: ["./index.ts"],
	platform: "node",
};

const browserConfig: Options = {
	...baseConfig,
	entry: ["./index.ts"],
	platform: "browser",
	target: "es2018",
	splitting: true,
	outDir: "dist/browser",
};

export default [nodeConfig, browserConfig];
