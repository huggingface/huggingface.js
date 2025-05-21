#!/usr/bin/env node
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { lstat, readFile } from "node:fs/promises";
import { z } from "zod";
import { downloadFileToCacheDir, type RepoDesignation } from "@huggingface/hub";
import { PROVIDERS_OR_POLICIES } from "@huggingface/inference";
import { Agent } from "@huggingface/mcp-client";
import { version as packageVersion } from "../package.json";
import { ServerConfigSchema } from "./lib/types";
import { debug, error } from "./lib/utils";
import { mainCliLoop } from "./lib/mainCliLoop";

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

interface TinyAgentConfig {
	configJson: string;
	prompt?: string;
}

const CLI_COMMANDS = ["run", "serve"] as const;
function isValidCommand(command: string): command is (typeof CLI_COMMANDS)[number] {
	return (CLI_COMMANDS as unknown as string[]).includes(command);
}

const FILENAME_CONFIG = "agent.json";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FILENAME_PROMPT = "PROMPT.md";

const TINY_AGENTS_HUB_REPO: RepoDesignation = {
	name: "huggingface/tiny-agents",
	type: "dataset",
};

async function tryLoadFromFile(filePath: string): Promise<TinyAgentConfig | undefined> {
	try {
		const configJson = await readFile(filePath, { encoding: "utf8" });
		return { configJson };
	} catch {
		return undefined;
	}
}

async function tryLoadFromDirectory(dirPath: string): Promise<TinyAgentConfig | undefined> {
	const stats = await lstat(dirPath).catch(() => undefined);
	if (!stats?.isDirectory()) {
		return undefined;
	}

	let prompt: string | undefined;
	try {
		prompt = await readFile(join(dirPath, FILENAME_PROMPT), { encoding: "utf8" });
	} catch {
		debug(`PROMPT.md not found in ${dirPath}, continuing without prompt template`);
	}

	try {
		return {
			configJson: await readFile(join(dirPath, FILENAME_CONFIG), { encoding: "utf8" }),
			prompt,
		};
	} catch {
		error(`Config file not found in specified local directory.`);
		process.exit(1);
	}
}

async function tryLoadFromHub(agentId: string): Promise<TinyAgentConfig | undefined> {
	let configJson: string;
	try {
		const configPath = await downloadFileToCacheDir({
			repo: TINY_AGENTS_HUB_REPO,
			path: `${agentId}/${FILENAME_CONFIG}`,
			accessToken: process.env.HF_TOKEN,
		});
		configJson = await readFile(configPath, { encoding: "utf8" });
	} catch {
		return undefined;
	}

	let prompt: string | undefined;
	try {
		const promptPath = await downloadFileToCacheDir({
			repo: TINY_AGENTS_HUB_REPO,
			path: `${agentId}/${FILENAME_PROMPT}`,
			accessToken: process.env.HF_TOKEN,
		});
		prompt = await readFile(promptPath, { encoding: "utf8" });
	} catch {
		debug(
			`PROMPT.md not found in https://huggingface.co/datasets/huggingface/tiny-agents/tree/main/${agentId}, continuing without prompt template`
		);
	}

	return {
		configJson,
		prompt,
	};
}

async function loadConfigFrom(loadFrom: string): Promise<TinyAgentConfig> {
	// First try as a local file
	const fileConfig = await tryLoadFromFile(loadFrom);
	if (fileConfig) {
		return fileConfig;
	}

	// Then try as a local directory
	const dirConfig = await tryLoadFromDirectory(loadFrom);
	if (dirConfig) {
		return dirConfig;
	}

	// Finally try loading from repo
	const repoConfig = await tryLoadFromHub(loadFrom);
	if (repoConfig) {
		return repoConfig;
	}

	error(
		`Config file not found in tiny-agents! Please make sure it exists locally or in https://huggingface.co/datasets/huggingface/tiny-agents.`
	);
	process.exit(1);
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

	if (command === "serve") {
		error(`Serve is not implemented yet, coming soon!`);
		process.exit(1);
	} else {
		debug(agent);
		// main loop from mcp-client/cli.ts
		await mainCliLoop(agent);
	}
}

main();
