import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InferenceClient } from "@huggingface/inference";
import type { InferenceProvider } from "@huggingface/inference";
import type {
	ChatCompletionInputMessage,
	ChatCompletionInputTool,
	ChatCompletionOutput,
} from "@huggingface/tasks/src/tasks/chat-completion/inference";
import { version as packageVersion } from "../package.json";
import { debug } from "./utils";

type ToolName = string;

export interface ChatCompletionInputMessageTool extends ChatCompletionInputMessage {
	role: "tool";
	tool_call_id: string;
	content: string;
	name?: string;
}

export class McpClient {
	protected client: InferenceClient;
	protected provider: string;
	protected model: string;
	private clients: Map<ToolName, Client> = new Map();
	public readonly availableTools: ChatCompletionInputTool[] = [];

	constructor({ provider, model, apiKey }: { provider: InferenceProvider; model: string; apiKey: string }) {
		this.client = new InferenceClient(apiKey);
		this.provider = provider;
		this.model = model;
	}

	async addMcpServers(servers: StdioServerParameters[]): Promise<void> {
		await Promise.all(servers.map((s) => this.addMcpServer(s)));
	}

	async addMcpServer(server: StdioServerParameters): Promise<void> {
		const transport = new StdioClientTransport({
			...server,
			env: { ...server.env, PATH: process.env.PATH ?? "" },
		});
		const mcp = new Client({ name: "@huggingface/mcp-client", version: packageVersion });
		await mcp.connect(transport);

		const toolsResult = await mcp.listTools();
		debug(
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

	async *processSingleTurnWithTools(
		messages: ChatCompletionInputMessage[],
		opts: { exitLoopTools?: ChatCompletionInputTool[]; exitIfNoTool?: boolean } = {}
	): AsyncGenerator<ChatCompletionOutput | ChatCompletionInputMessageTool> {
		debug("start of single turn");

		const response = await this.client.chatCompletion({
			provider: this.provider,
			model: this.model,
			messages,
			tools: opts.exitLoopTools ? [...opts.exitLoopTools, ...this.availableTools] : this.availableTools,
			tool_choice: "auto",
		});

		const toolCalls = response.choices[0].message.tool_calls;
		if (!toolCalls || toolCalls.length === 0) {
			if (opts.exitIfNoTool) {
				return;
			}
			messages.push({
				role: response.choices[0].message.role,
				content: response.choices[0].message.content,
			});
			return yield response;
		}
		for (const toolCall of toolCalls) {
			const toolName = toolCall.function.name;
			const toolArgs = JSON.parse(toolCall.function.arguments);

			const message: ChatCompletionInputMessageTool = {
				role: "tool",
				tool_call_id: toolCall.id,
				content: "",
				name: toolName,
			};
			if (opts.exitLoopTools?.map((t) => t.function.name).includes(toolName)) {
				messages.push(message);
				return yield message;
			}
			/// Get the appropriate session for this tool
			const client = this.clients.get(toolName);
			if (client) {
				const result = await client.callTool({ name: toolName, arguments: toolArgs });
				message.content = (result.content as Array<{ text: string }>)[0].text;
			} else {
				message.content = `Error: No session found for tool: ${toolName}`;
			}
			messages.push(message);
			yield message;
		}
	}

	async cleanup(): Promise<void> {
		const clients = new Set(this.clients.values());
		await Promise.all([...clients].map((client) => client.close()));
	}

	async [Symbol.dispose](): Promise<void> {
		return this.cleanup();
	}
}
