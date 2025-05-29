#!/usr/bin/env node
import { parseArgs } from "node:util";
import { z } from "zod";
import { PROVIDERS_OR_POLICIES } from "@huggingface/inference";
import { Agent } from "@huggingface/mcp-client";
import { version as packageVersion } from "../package.json";
import { ServerConfigSchema } from "./lib/types";
import { debug, error } from "./lib/utils";
import { mainCliLoop } from "./lib/mainCliLoop";
import { startServer } from "./lib/webServer";
import { loadConfigFrom } from "./lib/loadConfigFrom";

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
		error(`You need to call run or serve, followed by an agent id (local path or Hub identifier).`);
		console.log(USAGE_HELP);
		process.exit(1);
	}

	const { configJson, prompt } = await loadConfigFrom(loadFrom);

	const ConfigSchema = z
		.object({
			model: z.string(),
			provider: z.enum(PROVIDERS_OR_POLICIES).optional(),
			endpointUrl: z.string().optional(),
			apiKey: z.string().optional(),
			servers: z.array(ServerConfigSchema),
		})
		.refine((data) => data.provider !== undefined || data.endpointUrl !== undefined, {
			message: "At least one of 'provider' or 'endpointUrl' is required",
		});

	let config: z.infer<typeof ConfigSchema>;
	try {
		const parsedConfig = JSON.parse(configJson);
		config = ConfigSchema.parse(parsedConfig);
	} catch (err) {
		error("Invalid configuration file:", err instanceof Error ? err.message : err);
		process.exit(1);
	}

	const agent = new Agent(
		config.endpointUrl
			? {
					endpointUrl: config.endpointUrl,
					model: config.model,
					apiKey: config.apiKey ?? process.env.API_KEY ?? process.env.HF_TOKEN,
					servers: config.servers,
					prompt,
			  }
			: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					provider: config.provider!,
					model: config.model,
					apiKey: config.apiKey ?? process.env.API_KEY ?? process.env.HF_TOKEN,
					servers: config.servers,
					prompt,
			  }
	);

	debug(agent);
	await agent.loadTools();

	if (command === "run") {
		mainCliLoop(agent);
	} else {
		startServer(agent);
	}
}

main();
