import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { homedir } from "os";
import { join } from "path";
import { InferenceClient } from "@huggingface/inference";
import type { InferenceProvider } from "@huggingface/inference";
import type {
	ChatCompletionInputMessage,
	ChatCompletionInputTool,
	ChatCompletionOutput,
} from "@huggingface/tasks/src/tasks/chat-completion/inference";
import { version as packageVersion } from "../package.json";

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
			env: { ...env, PATH: process.env.PATH ?? "" },
		});
		const mcp = new Client({ name: "@huggingface/mcp-client", version: packageVersion });
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
		const messages: ChatCompletionInputMessage[] = [
			{
				role: "user",
				content: query,
			},
		];

		const response = await this.client.chatCompletion({
			provider: this.provider,
			model: this.model,
			messages,
			tools: this.availableTools,
			tool_choice: "auto",
		});

		const toolCalls = response.choices[0].message.tool_calls;
		if (!toolCalls || toolCalls.length === 0) {
			return response;
		}
		for (const toolCall of toolCalls) {
			const toolName = toolCall.function.name;
			const toolArgs = JSON.parse(toolCall.function.arguments);

			/// Get the appropriate session for this tool
			const client = this.clients.get(toolName);
			if (client) {
				const result = await client.callTool({ name: toolName, arguments: toolArgs });
				messages.push({
					tool_call_id: toolCall.id,
					role: "tool",
					name: toolName,
					content: (result.content as Array<{ text: string }>)[0].text,
				});
			} else {
				messages.push({
					tool_call_id: toolCall.id,
					role: "tool",
					name: toolName,
					content: `Error: No session found for tool: ${toolName}`,
				});
			}
		}

		const enrichedResponse = await this.client.chatCompletion({
			provider: this.provider,
			model: this.model,
			messages,
		});

		return enrichedResponse;
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

main();
