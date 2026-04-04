import { type UserConfig } from "tsdown";

const baseEntry = ["./src/index.ts"];
const baseConfig: UserConfig = {
	entry: baseEntry,
	format: ["cjs", "esm"],
	outDir: "dist",
	clean: true,
};

const nodeConfig: UserConfig = {
	...baseConfig,
	entry: [...baseEntry, "./src/cli.ts"],
	platform: "node",
};

const browserConfig: UserConfig = {
	...baseConfig,
	platform: "browser",
	target: "es2018",
	outDir: "dist/browser",
};

export default [nodeConfig, browserConfig];
