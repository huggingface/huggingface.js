import { readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

const content = [
	"// Generated file from package.json. Issues importing JSON directly when publishing on commonjs/ESM - see https://github.com/microsoft/TypeScript/issues/51783",
	`export const PACKAGE_VERSION = ${JSON.stringify(pkg.version)};`,
	`export const PACKAGE_NAME = ${JSON.stringify(pkg.name)};`,
	"",
].join("\n");

writeFileSync("./src/package.ts", content);
