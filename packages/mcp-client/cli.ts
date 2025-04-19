import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { join } from "node:path";
import { homedir } from "node:os";
import { Agent } from "./src";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";

const ANSI = {
	BLUE: "\x1b[34m",
	GREEN: "\x1b[32m",
	RED: "\x1b[31m",
	RESET: "\x1b[0m",
};

const SERVERS: StdioServerParameters[] = [
	{
		// Filesystem "official" mcp-server with access to your Desktop
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-filesystem", join(homedir(), "Desktop")],
	},
	{
		// Early version of a HF-MCP server
		command: "node",
		args: ["--disable-warning=ExperimentalWarning", join(homedir(), "Desktop/hf-mcp/index.ts")],
		env: {
			HF_TOKEN: process.env.HF_TOKEN ?? "",
		},
	},
];

async function main() {
	if (!process.env.HF_TOKEN) {
		console.error(`a valid HF_TOKEN must be present in the env`);
		process.exit(1);
	}

	const agent = new Agent({
		provider: "together",
		model: "Qwen/Qwen2.5-72B-Instruct",
		apiKey: process.env.HF_TOKEN,
		servers: SERVERS,
	});

	const rl = readline.createInterface({ input: stdin, output: stdout });
	rl.on("SIGINT", async () => {
		await agent.cleanup();
		stdout.write("\n");
		rl.close();
	});

	await agent.loadTools();

	stdout.write(ANSI.BLUE);
	stdout.write(`Agent loaded with ${agent.availableTools.length} tools:\n`);
	stdout.write(agent.availableTools.map((t) => `- ${t.function.name}`).join("\n"));
	stdout.write(ANSI.RESET);
	stdout.write("\n");

	while (true) {
		const input = await rl.question("> ");
		for await (const response of agent.processSingleTurn(input)) {
			if ("choices" in response) {
				stdout.write(response.choices[0].message.content ?? "");
				stdout.write("\n\n");
			} else {
				/// Tool call info
				stdout.write(ANSI.GREEN);
				stdout.write(`Tool[${response.name}] ${response.tool_call_id}\n`);
				stdout.write(response.content);
				stdout.write(ANSI.RESET);
				stdout.write("\n\n");
			}
		}
	}
}

main();
