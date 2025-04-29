#!/usr/bin/env node
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { join } from "node:path";
import { homedir } from "node:os";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { InferenceProvider } from "@huggingface/inference";
import { ANSI } from "./src/utils";
import { Agent } from "./src";
import { version as packageVersion } from "./package.json";

const MODEL_ID = process.env.MODEL_ID ?? "Qwen/Qwen2.5-72B-Instruct";
const PROVIDER = (process.env.PROVIDER as InferenceProvider) ?? "nebius";
const BASE_URL = process.env.BASE_URL;

const SERVERS: StdioServerParameters[] = [
	{
		// Filesystem "official" mcp-server with access to your Desktop
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-filesystem", join(homedir(), "Desktop")],
	},
	{
		// Playwright MCP
		command: "npx",
		args: ["@playwright/mcp@latest"],
	},
];

if (process.env.EXPERIMENTAL_HF_MCP_SERVER) {
	SERVERS.push({
		// Early version of a HF-MCP server
		// you can download it from gist.github.com/julien-c/0500ba922e1b38f2dc30447fb81f7dc6
		command: "node",
		args: ["--disable-warning=ExperimentalWarning", join(homedir(), "Desktop/hf-mcp/index.ts")],
		env: {
			HF_TOKEN: process.env.HF_TOKEN ?? "",
		},
	});
}

async function main() {
	if (process.argv.includes("--version")) {
		console.log(packageVersion);
		process.exit(0);
	}

	if (!process.env.HF_TOKEN) {
		console.error(`a valid HF_TOKEN must be present in the env`);
		process.exit(1);
	}

	const agent = new Agent(
		ENDPOINT_URL
			? {
					baseUrl: ENDPOINT_URL,
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
