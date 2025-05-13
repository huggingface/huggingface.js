#!/usr/bin/env node
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { join } from "node:path";
import { homedir } from "node:os";
import { parseArgs } from "node:util";
import type { InferenceProviderOrPolicy } from "@huggingface/inference";
import { version as packageVersion } from "../package.json";

const SERVERS: ServerConfig[] = [
	{
		// Filesystem "official" mcp-server with access to your Desktop
		command: "npx",
		args: [
			"-y",
			"@modelcontextprotocol/server-filesystem",
			process.platform === "darwin" ? join(homedir(), "Desktop") : homedir(),
		],
	},
	{
		// Playwright MCP
		command: "npx",
		args: ["@playwright/mcp@latest"],
	},
];

async function main() {
	const {
		values: { url: urls },
	} = parseArgs({
		options: {
			url: {
				type: "string",
				multiple: true,
			},
		},
	});
	if (urls?.length) {
		while (SERVERS.length) {
			SERVERS.pop();
		}
		for (const url of urls) {
			try {
				SERVERS.push(urlToServerConfig(url, process.env.HF_TOKEN));
			} catch (error) {
				console.error(`Error adding server from URL "${url}": ${error.message}`);
			}
		}
	}

	if (process.argv.includes("--version")) {
		console.log(packageVersion);
		process.exit(0);
	}
}

main();
