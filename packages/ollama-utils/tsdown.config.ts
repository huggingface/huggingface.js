import type { UserConfig } from "tsdown";

const baseConfig: UserConfig = {
	entry: ["./index.ts"],
	format: ["cjs", "esm"],
	outDir: "dist",
	clean: true,
};

const nodeConfig: UserConfig = {
	...baseConfig,
	platform: "node",
};

const browserConfig: UserConfig = {
	...baseConfig,
	platform: "browser",
	target: "es2018",
	outDir: "dist/browser",
};

export default [nodeConfig, browserConfig];
