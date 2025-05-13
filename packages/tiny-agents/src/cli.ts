#!/usr/bin/env node
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { PROVIDERS_OR_POLICIES } from "@huggingface/inference";
import { Agent } from "@huggingface/mcp-client";
import type { ServerConfig } from "@huggingface/mcp-client";
import { version as packageVersion } from "../package.json";

const USAGE_HELP = `
Usage:
  tiny-agents [flags]
  tiny-agents run   "agent/id"
  tiny-agents serve "agent/id"

Available Commands:
  run         Run the Agent in command-line
  serve       Run the Agent as an OpenAI-compatible HTTP server

Flags:
  -h, --help      help for tiny-agents
  -v, --version   Show version information
`.trim();

const CLI_COMMANDS = ["run", "serve"] as const;
function isValidCommand(command: string): command is (typeof CLI_COMMANDS)[number] {
	return (CLI_COMMANDS as unknown as string[]).includes(command);
}

const FILENAME_CONFIG = "agent.json";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FILENAME_PROMPT = "PROMPT.md";

async function loadConfigFrom(loadFrom: string): Promise<string> {
	try {
		/// First try it as a local directory path, then we will try as a path inside the repo itself
		return await readFile(loadFrom, { encoding: "utf8" });
	} catch {
		const srcDir = dirname(__filename);
		const configPath = join(srcDir, "agents", loadFrom, FILENAME_CONFIG);
		try {
			return await readFile(configPath, { encoding: "utf8" });
		} catch {
			console.error(`Config file not found! Loading from the HF Hub is not implemented yet`);
			process.exit(1);
		}
	}
}

async function main() {
	const {
		values: { help, version },
		positionals,
	} = parseArgs({
		options: {
			help: {
				type: "boolean",
				short: "h",
			},
			version: {
				type: "boolean",
				short: "v",
			},
		},
		allowPositionals: true,
	});
	if (version) {
		console.log(packageVersion);
		process.exit(0);
	}
	const command = positionals[0];
	const loadFrom = positionals[1];
	if (help) {
		console.log(USAGE_HELP);
		process.exit(0);
	}
	if (positionals.length !== 2 || !isValidCommand(command)) {
		console.error(`You need to call run or serve, followed by an agent id (local path or Hub identifier).`);
		console.log(USAGE_HELP);
		process.exit(1);
	}

	if (command === "serve") {
		console.error(`Serve is not implemented yet, coming soon!`);
		process.exit(1);
	} else {
		const configJson = await loadConfigFrom(loadFrom);

		const ConfigSchema = z.object({
			model: z.string(),
			provider: z.enum(PROVIDERS_OR_POLICIES),
			servers: z.array(z.custom<ServerConfig>()),
		});

		let config: z.infer<typeof ConfigSchema>;
		try {
			const parsedConfig = JSON.parse(configJson);
			config = ConfigSchema.parse(parsedConfig);
		} catch (error) {
			console.error("Invalid configuration file:", error instanceof Error ? error.message : error);
			process.exit(1);
		}
		const agent = new Agent({
			provider: config.provider,
			model: config.model,
			apiKey: process.env.HF_TOKEN ?? "",
			servers: config.servers,
		});

		console.log(agent);

		// TODO: hook main loop from mcp-client/cli.ts
	}
}

main();
