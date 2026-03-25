import type { UserConfig } from "tsdown";

const baseConfig = {
	entry: ["./index.ts"],
	format: ["cjs", "esm"],
	outDir: "dist",
	clean: true,
} satisfies UserConfig;

const nodeConfig = {
	...baseConfig,
	entry: [...baseConfig.entry, "./cli.ts"],
	platform: "node",
} satisfies UserConfig;

const browserConfig = {
	...baseConfig,
	platform: "browser",
	target: "es2022",
	outDir: "dist/browser",
} satisfies UserConfig;

export default [nodeConfig, browserConfig];
