import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { join } from "node:path";
import { homedir } from "node:os";
import { Agent } from "./src";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ANSI } from "./src/utils";
import type { InferenceProvider } from "@huggingface/inference";

const MODEL_ID = process.env.MODEL_ID ?? "Qwen/Qwen2.5-72B-Instruct";
const PROVIDER = (process.env.PROVIDER as InferenceProvider) ?? "together";

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
		command: "node",
		args: ["--disable-warning=ExperimentalWarning", join(homedir(), "Desktop/hf-mcp/index.ts")],
		env: {
			HF_TOKEN: process.env.HF_TOKEN ?? "",
		},
	});
}

async function main() {
	if (!process.env.HF_TOKEN) {
		console.error(`a valid HF_TOKEN must be present in the env`);
		process.exit(1);
	}

	const agent = new Agent({
		provider: PROVIDER,
		model: MODEL_ID,
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
		for await (const response of agent.run(input)) {
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
