import type { Options } from "tsdown";

const baseConfig = {
	entry: ["./index.ts"],
	format: ["cjs", "esm"],
	outDir: "dist",
	clean: true,
} satisfies Options;

const nodeConfig: Options = {
	...baseConfig,
	entry: [...baseConfig.entry, "./cli.ts"],
	platform: "node",
};

const browserConfig: Options = {
	...baseConfig,
	platform: "browser",
	target: "es2022",

	outDir: "dist/browser",
};

export default [nodeConfig, browserConfig];
