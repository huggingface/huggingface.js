import type { UserConfig } from "tsdown";

const config: UserConfig = {
	entry: ["./src/index.ts", "./cli.ts"],
	format: ["cjs", "esm"],
	outDir: "dist",
	clean: true,
};

export default config;
