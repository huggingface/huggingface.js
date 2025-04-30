import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InferenceClient } from "@huggingface/inference";
import type { InferenceClientEndpoint, InferenceProviderOrPolicy } from "@huggingface/inference";
import type {
	ChatCompletionInputMessage,
	ChatCompletionInputTool,
	ChatCompletionStreamOutput,
	ChatCompletionStreamOutputDeltaToolCall,
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
	protected client: InferenceClient | InferenceClientEndpoint;
	protected provider: InferenceProviderOrPolicy | undefined;

	protected model: string;
	private clients: Map<ToolName, Client> = new Map();
	public readonly availableTools: ChatCompletionInputTool[] = [];

	constructor({
		provider,
		baseUrl,
		model,
		apiKey,
	}: (
		| {
				provider: InferenceProviderOrPolicy;
				baseUrl?: undefined;
		  }
		| {
				baseUrl: string;
				provider?: undefined;
		  }
	) & {
		model: string;
		apiKey: string;
	}) {
		this.client = baseUrl ? new InferenceClient(apiKey).endpoint(baseUrl) : new InferenceClient(apiKey);
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
		opts: {
			exitLoopTools?: ChatCompletionInputTool[];
			exitIfFirstChunkNoTool?: boolean;
			abortSignal?: AbortSignal;
		} = {}
	): AsyncGenerator<ChatCompletionStreamOutput | ChatCompletionInputMessageTool> {
		debug("start of single turn");

		const stream = this.client.chatCompletionStream({
			provider: this.provider,
			model: this.model,
			messages,
			tools: opts.exitLoopTools ? [...opts.exitLoopTools, ...this.availableTools] : this.availableTools,
			tool_choice: "auto",
			signal: opts.abortSignal,
		});

		const message = {
			role: "unknown",
			content: "",
		} satisfies ChatCompletionInputMessage;
		const finalToolCalls: Record<number, ChatCompletionStreamOutputDeltaToolCall> = {};
		let numOfChunks = 0;

		for await (const chunk of stream) {
			if (opts.abortSignal?.aborted) {
				throw new Error("AbortError");
			}
			yield chunk;
			debug(chunk.choices[0]);
			numOfChunks++;
			const delta = chunk.choices[0]?.delta;
			if (!delta) {
				continue;
			}
			if (delta.role) {
				message.role = delta.role;
			}
			if (delta.content) {
				message.content += delta.content;
			}
			for (const toolCall of delta.tool_calls ?? []) {
				// aggregating chunks into an encoded arguments JSON object
				if (!finalToolCalls[toolCall.index]) {
					finalToolCalls[toolCall.index] = toolCall;
				}
				if (finalToolCalls[toolCall.index].function.arguments === undefined) {
					finalToolCalls[toolCall.index].function.arguments = "";
				}
				if (toolCall.function.arguments) {
					finalToolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
				}
			}
			if (opts.exitIfFirstChunkNoTool && numOfChunks <= 2 && Object.keys(finalToolCalls).length === 0) {
				/// If no tool is present in chunk number 1 or 2, exit.
				return;
			}
		}

		messages.push(message);

		for (const toolCall of Object.values(finalToolCalls)) {
			const toolName = toolCall.function.name ?? "unknown";
			/// TODO(Fix upstream type so this is always a string)^
			const toolArgs = toolCall.function.arguments === "" ? {} : JSON.parse(toolCall.function.arguments);

			const toolMessage: ChatCompletionInputMessageTool = {
				role: "tool",
				tool_call_id: toolCall.id,
				content: "",
				name: toolName,
			};
			if (opts.exitLoopTools?.map((t) => t.function.name).includes(toolName)) {
				messages.push(toolMessage);
				return yield toolMessage;
			}
			/// Get the appropriate session for this tool
			const client = this.clients.get(toolName);
			if (client) {
				const result = await client.callTool({ name: toolName, arguments: toolArgs, signal: opts.abortSignal });
				toolMessage.content = (result.content as Array<{ text: string }>)[0].text;
			} else {
				toolMessage.content = `Error: No session found for tool: ${toolName}`;
			}
			messages.push(toolMessage);
			yield toolMessage;
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
