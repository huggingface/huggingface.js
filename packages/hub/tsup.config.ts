import type { Options } from "tsup";

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
	target: "es2018",
	splitting: true,
	outDir: "dist/browser",
};

export default [nodeConfig, browserConfig];
