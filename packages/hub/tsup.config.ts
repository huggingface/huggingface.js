import type { Options } from "tsup";

const baseConfig: Options = {
	entry: ["./index.ts"],
	format: ["cjs", "esm"],
	outDir: "dist",
	clean: true,
	dts: false,
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
};

export default [nodeConfig, browserConfig];
