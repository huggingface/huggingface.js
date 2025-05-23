#!/usr/bin/env node
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { join } from "node:path";
import { homedir } from "node:os";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { InferenceProviderOrPolicy } from "@huggingface/inference";
import { ANSI, urlToServerConfig } from "./src/utils";
import { Agent } from "./src";
import { version as packageVersion } from "./package.json";
import { parseArgs } from "node:util";
import type { ServerConfig } from "./src/types";

const MODEL_ID = process.env.MODEL_ID ?? "Qwen/Qwen2.5-72B-Instruct";
const PROVIDER = (process.env.PROVIDER as InferenceProviderOrPolicy) ?? "nebius";
const ENDPOINT_URL = process.env.ENDPOINT_URL ?? process.env.BASE_URL;

const SERVERS: (ServerConfig | StdioServerParameters)[] = [
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

// Handle --url parameters from command line: each URL will be parsed into a ServerConfig object
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

async function main() {
	if (process.argv.includes("--version")) {
		console.log(packageVersion);
		process.exit(0);
	}

	if (!ENDPOINT_URL && !process.env.HF_TOKEN) {
		console.error(`To use a remote inference provider, a valid HF_TOKEN must be present in the env`);
		process.exit(1);
	}

	const agent = new Agent(
		ENDPOINT_URL
			? {
					endpointUrl: ENDPOINT_URL,
					model: MODEL_ID,
					apiKey: process.env.HF_TOKEN,
					servers: SERVERS,
			  }
			: {
					provider: PROVIDER,
					model: MODEL_ID,
					apiKey: process.env.HF_TOKEN,
					servers: SERVERS,
			  }
	);

	const rl = readline.createInterface({ input: stdin, output: stdout });
	let abortController = new AbortController();
	let waitingForInput = false;
	async function waitForInput() {
		waitingForInput = true;
		const input = await rl.question("> ");
		waitingForInput = false;
		return input;
	}
	rl.on("SIGINT", async () => {
		if (waitingForInput) {
			// close the whole process
			await agent.cleanup();
			stdout.write("\n");
			rl.close();
		} else {
			// otherwise, it means a request is underway
			abortController.abort();
			abortController = new AbortController();
			stdout.write("\n");
			stdout.write(ANSI.GRAY);
			stdout.write("Ctrl+C a second time to exit");
			stdout.write(ANSI.RESET);
			stdout.write("\n");
		}
	});
	process.on("uncaughtException", (err) => {
		stdout.write("\n");
		rl.close();
		throw err;
	});

	await agent.loadTools();

	stdout.write(ANSI.BLUE);
	stdout.write(`Agent loaded with ${agent.availableTools.length} tools:\n`);
	stdout.write(agent.availableTools.map((t) => `- ${t.function.name}`).join("\n"));
	stdout.write(ANSI.RESET);
	stdout.write("\n");

	while (true) {
		const input = await waitForInput();
		for await (const chunk of agent.run(input, { abortSignal: abortController.signal })) {
			if ("choices" in chunk) {
				const delta = chunk.choices[0]?.delta;
				if (delta.content) {
					stdout.write(delta.content);
				}
				if (delta.tool_calls) {
					stdout.write(ANSI.GRAY);
					for (const deltaToolCall of delta.tool_calls) {
						if (deltaToolCall.id) {
							stdout.write(`<Tool ${deltaToolCall.id}>\n`);
						}
						if (deltaToolCall.function.name) {
							stdout.write(deltaToolCall.function.name + " ");
						}
						if (deltaToolCall.function.arguments) {
							stdout.write(deltaToolCall.function.arguments);
						}
					}
					stdout.write(ANSI.RESET);
				}
			} else {
				/// Tool call info
				stdout.write("\n\n");
				stdout.write(ANSI.GREEN);
				stdout.write(`Tool[${chunk.name}] ${chunk.tool_call_id}\n`);
				stdout.write(chunk.content);
				stdout.write(ANSI.RESET);
				stdout.write("\n\n");
			}
		}
		stdout.write("\n");
	}
}

main();
