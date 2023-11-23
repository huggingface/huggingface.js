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

export default nodeConfig;
