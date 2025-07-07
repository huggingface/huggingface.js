#!/usr/bin/env node
import { parseArgs } from "node:util";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { z } from "zod";
import { PROVIDERS_OR_POLICIES } from "@huggingface/inference";
import type { ServerConfig } from "@huggingface/mcp-client";
import { Agent } from "@huggingface/mcp-client";
import { version as packageVersion } from "../package.json";
import { InputConfigSchema, ServerConfigSchema } from "./lib/types";
import { debug, error, ANSI } from "./lib/utils";
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
			inputs: z.array(InputConfigSchema).optional(),
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

	// Handle inputs (i.e. env variables injection)
	if (config.inputs && config.inputs.length > 0) {
		const rl = readline.createInterface({ input: stdin, output: stdout });

		stdout.write(ANSI.BLUE);
		stdout.write("Some initial inputs are required by the agent. ");
		stdout.write("Please provide a value or leave empty to load from env.");
		stdout.write(ANSI.RESET);
		stdout.write("\n");

		for (const inputItem of config.inputs) {
			const inputId = inputItem.id;
			const description = inputItem.description;
			const envSpecialValue = `\${input:${inputId}}`; // Special value to indicate env variable injection

			// Check env variables that will use this input
			const inputVars = new Set<string>();
			for (const server of config.servers) {
				if (server.type === "stdio" && server.env) {
					for (const [key, value] of Object.entries(server.env)) {
						if (value === envSpecialValue) {
							inputVars.add(key);
						}
					}
				}
				if ((server.type === "http" || server.type === "sse") && server.headers) {
					for (const [key, value] of Object.entries(server.headers)) {
						if (value.includes(envSpecialValue)) {
							inputVars.add(key);
						}
					}
				}
			}

			if (inputVars.size === 0) {
				stdout.write(ANSI.YELLOW);
				stdout.write(`Input ${inputId} defined in config but not used by any server.`);
				stdout.write(ANSI.RESET);
				stdout.write("\n");
				continue;
			}

			// Prompt user for input
			const envVariableKey = inputId.replaceAll("-", "_").toUpperCase();
			stdout.write(ANSI.BLUE);
			stdout.write(` • ${inputId}`);
			stdout.write(ANSI.RESET);
			stdout.write(`: ${description}. (default: load from ${envVariableKey}) `);
			stdout.write("\n");

			const userInput = (await rl.question("")).trim();

			// Inject user input (or env variable) into servers' env
			for (const server of config.servers) {
				if (server.type === "stdio" && server.env) {
					for (const [key, value] of Object.entries(server.env)) {
						if (value === envSpecialValue) {
							if (userInput) {
								server.env[key] = userInput;
							} else {
								const valueFromEnv = process.env[envVariableKey] || "";
								server.env[key] = valueFromEnv;
								if (valueFromEnv) {
									stdout.write(ANSI.GREEN);
									stdout.write(`Value successfully loaded from '${envVariableKey}'`);
									stdout.write(ANSI.RESET);
									stdout.write("\n");
								} else {
									stdout.write(ANSI.YELLOW);
									stdout.write(`No value found for '${envVariableKey}' in environment variables. Continuing.`);
									stdout.write(ANSI.RESET);
									stdout.write("\n");
								}
							}
						}
					}
				}
				if ((server.type === "http" || server.type === "sse") && server.headers) {
					for (const [key, value] of Object.entries(server.headers)) {
						if (value.includes(envSpecialValue)) {
							if (userInput) {
								server.headers[key] = value.replace(envSpecialValue, userInput);
							} else {
								const valueFromEnv = process.env[envVariableKey] || "";
								server.headers[key] = value.replace(envSpecialValue, valueFromEnv);
								if (valueFromEnv) {
									stdout.write(ANSI.GREEN);
									stdout.write(`Value successfully loaded from '${envVariableKey}'`);
									stdout.write(ANSI.RESET);
									stdout.write("\n");
								} else {
									stdout.write(ANSI.YELLOW);
									stdout.write(`No value found for '${envVariableKey}' in environment variables. Continuing.`);
									stdout.write(ANSI.RESET);
									stdout.write("\n");
								}
							}
						}
					}
				}
			}
		}

		stdout.write("\n");
		rl.close();
	}

	const formattedServers: ServerConfig[] = config.servers.map((server) => {
		switch (server.type) {
			case "stdio":
				return {
					type: "stdio",
					config: {
						command: server.command,
						args: server.args ?? [],
						env: server.env ?? {},
						cwd: server.cwd ?? process.cwd(),
					},
				};
			case "http":
			case "sse":
				return {
					type: server.type,
					config: {
						url: server.url,
						requestInit: {
							headers: server.headers,
						},
					},
				};
		}
	});

	const agent = new Agent(
		config.endpointUrl
			? {
					endpointUrl: config.endpointUrl,
					model: config.model,
					apiKey: config.apiKey ?? process.env.API_KEY ?? process.env.HF_TOKEN,
					servers: formattedServers,
					prompt,
			  }
			: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					provider: config.provider!,
					model: config.model,
					apiKey: config.apiKey ?? process.env.API_KEY ?? process.env.HF_TOKEN,
					servers: formattedServers,
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
