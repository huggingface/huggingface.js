import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InferenceClient } from "./InferenceClient";
import { homedir } from "os";
import { join } from "path";
import type { InferenceProvider } from "./types";
import type {
	ChatCompletionInputTool,
	ChatCompletionOutput,
} from "@huggingface/tasks/src/tasks/chat-completion/inference";

type ToolName = string;

export class McpClient {
	private client: InferenceClient;
	private provider: string;
	private model: string;
	private clients: Map<ToolName, Client> = new Map();
	private availableTools: ChatCompletionInputTool[] = [];

	constructor({ provider, model, apiKey }: { provider: InferenceProvider; model: string; apiKey: string }) {
		this.client = new InferenceClient(apiKey);
		this.provider = provider;
		this.model = model;
	}

	async addMcpServer(command: string, args: string[], env: Record<string, string>): Promise<void> {
		const transport = new StdioClientTransport({
			command,
			args,
			env,
		});
		const mcp = new Client({ name: "@huggingface/mcp-client", version: "1.0.0" });
		await mcp.connect(transport);

		const toolsResult = await mcp.listTools();
		console.log(
			"Connected to server with tools:",
			toolsResult.tools.map(({ name }) => name)
		);

		for (const tool of toolsResult.tools) {
			this.clients.set(tool.name, mcp);
		}

		this.availableTools.push(
			...toolsResult.tools.map((tool) => {
				return {
					type: "function",
					function: {
						name: tool.name,
						description: tool.description,
						parameters: tool.inputSchema,
					},
				} satisfies ChatCompletionInputTool;
			})
		);
	}

	async processQuery(query: string): Promise<ChatCompletionOutput> {
		/// TODO
	}

	async cleanup(): Promise<void> {
		const clients = new Set(this.clients.values());
		await Promise.all([...clients].map((client) => client.close()));
	}
}

async function main() {
	if (!process.env.HF_TOKEN) {
		console.error(`a valid HF_TOKEN must be passed`);
		process.exit(1);
	}

	const client = new McpClient({
		provider: "together",
		model: "Qwen/Qwen2.5-72B-Instruct",
		apiKey: process.env.HF_TOKEN,
	});

	try {
		await client.addMcpServer(
			"node",
			["--disable-warning=ExperimentalWarning", join(homedir(), "Desktop/hf-mcp/index.ts")],
			{
				HF_TOKEN: process.env.HF_TOKEN,
			}
		);

		const response = await client.processQuery(`
			find an app that generates 3D models from text,
			and also get the best paper about transformers
		`);

		console.log("\n" + response.choices[0].message.content);
	} finally {
		await client.cleanup();
	}
}

if (require.main === module) {
	main();
}
