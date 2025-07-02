#!/usr/bin/env node
/**
 * AI-generated file using Cursor + Claude 4
 *
 * Run an example script
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , exampleName] = process.argv;
if (!exampleName) {
	console.error("Usage: run-example.js <example_name>");
	process.exit(1);
}

const examplePath = path.resolve(__dirname, "../examples", `${exampleName}.js`);
if (!fs.existsSync(examplePath)) {
	console.error(`Example script not found: ${examplePath}`);
	process.exit(1);
}

const result = spawnSync("node", [examplePath], { stdio: "inherit" });
process.exit(result.status);
