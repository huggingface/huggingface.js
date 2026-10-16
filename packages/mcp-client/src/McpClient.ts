import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InferenceClient } from "@huggingface/inference";
import type { InferenceProviderOrPolicy } from "@huggingface/inference";
import type {
	ChatCompletionInputMessage,
	ChatCompletionInputTool,
	ChatCompletionStreamOutput,
	ChatCompletionStreamOutputDeltaToolCall,
} from "@huggingface/tasks/src/tasks/chat-completion/inference";
import { version as packageVersion } from "../package.json";
import { debug } from "./utils";
import type { ServerConfig } from "./types";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ResultFormatter } from "./ResultFormatter.js";

type ToolName = string;

export interface ChatCompletionInputMessageTool extends ChatCompletionInputMessage {
	role: "tool";
	tool_call_id: string;
	content: string;
	name?: string;
}

/**
 * Assembles the streamed `tool_calls` deltas of one assistant message into complete tool calls.
 *
 * `index` is how OpenAI identifies a call across deltas, but OpenAI-compatible servers and gateways differ: some omit
 * it, some re-use one index for several calls, and some send `id` / `function.name` in a later delta.
 * A delta is therefore matched to a call in progress by `id` first, then by `index`, then by recency:
 * - a delta with an `id` we have not seen starts a new call, unless it lands on the index of a call that has no `id` yet;
 * - a delta with neither `id` nor `index` continues the most recent call, unless it carries a name and that call
 *   already has one (several whole calls written one after the other).
 */
class ToolCallAccumulator {
	readonly toolCalls: ChatCompletionStreamOutputDeltaToolCall[] = [];
	private readonly byId = new Map<string, ChatCompletionStreamOutputDeltaToolCall>();
	private readonly byIndex = new Map<number, ChatCompletionStreamOutputDeltaToolCall>();

	add(delta: ChatCompletionStreamOutputDeltaToolCall): void {
		let toolCall = this.find(delta);
		if (!toolCall) {
			/// first chunk of the tool call. Copy it: the chunk itself is yielded to the caller and must not change later.
			/// `.function.arguments` is always a string
			toolCall = { ...delta, function: { ...delta.function, arguments: delta.function.arguments ?? "" } };
			this.toolCalls.push(toolCall);
		} else {
			/// any subsequent chunk to the same tool call
			if (delta.id && !toolCall.id) {
				toolCall.id = delta.id;
			}
			const name = delta.function.name;
			if (name && !toolCall.function.name) {
				toolCall.function.name = name;
			} else if (name && name !== toolCall.function.name) {
				/// the name is split over several chunks (a chunk repeating the whole name is ignored)
				toolCall.function.name += name;
			}
			if (delta.function.arguments) {
				toolCall.function.arguments += delta.function.arguments;
			}
		}
		if (toolCall.id) {
			this.byId.set(toolCall.id, toolCall);
		}
		/// `index` is typed as always present, but some servers omit it
		if (delta.index !== undefined) {
			this.byIndex.set(delta.index, toolCall);
		}
	}

	private find(delta: ChatCompletionStreamOutputDeltaToolCall): ChatCompletionStreamOutputDeltaToolCall | undefined {
		const known = delta.id ? this.byId.get(delta.id) : undefined;
		if (known) {
			return known;
		}
		if (delta.index !== undefined) {
			const sameIndex = this.byIndex.get(delta.index);
			/// `sameIndex` would have been found by id above if it had the same one: a different id means an index re-used
			return !delta.id || !sameIndex?.id ? sameIndex : undefined;
		}
		if (delta.id) {
			return undefined;
		}
		const last = this.toolCalls[this.toolCalls.length - 1];
		return delta.function.name && last?.function.name ? undefined : last;
	}
}

export class McpClient {
	protected client: InferenceClient;
	protected provider: InferenceProviderOrPolicy | undefined;

	protected model: string;
	private clients: Map<ToolName, Client> = new Map();
	public readonly availableTools: ChatCompletionInputTool[] = [];

	constructor({
		provider,
		endpointUrl,
		model,
		apiKey,
	}: (
		| {
				provider: InferenceProviderOrPolicy;
				endpointUrl?: undefined;
		  }
		| {
				endpointUrl: string;
				provider?: undefined;
		  }
	) & {
		model: string;
		apiKey?: string;
	}) {
		this.client = endpointUrl ? new InferenceClient(apiKey, { endpointUrl: endpointUrl }) : new InferenceClient(apiKey);
		this.provider = provider;
		this.model = model;
	}

	async addMcpServers(servers: (ServerConfig | StdioServerParameters)[]): Promise<void> {
		await Promise.all(servers.map((s) => this.addMcpServer(s)));
	}

	async addMcpServer(server: ServerConfig | StdioServerParameters): Promise<void> {
		let transport: Transport;
		const asUrl = (url: string | URL): URL => {
			return typeof url === "string" ? new URL(url) : url;
		};

		if (!("type" in server)) {
			transport = new StdioClientTransport({
				...server,
				env: { ...server.env, PATH: process.env.PATH ?? "" },
			});
		} else {
			switch (server.type) {
				case "stdio":
					transport = new StdioClientTransport({
						...server.config,
						env: { ...server.config.env, PATH: process.env.PATH ?? "" },
					});
					break;
				case "sse":
					transport = new SSEClientTransport(asUrl(server.config.url), server.config.options);
					break;
				case "http":
					transport = new StreamableHTTPClientTransport(asUrl(server.config.url), server.config.options);
					break;
			}
		}
		const mcp = new Client({ name: "@huggingface/mcp-client", version: packageVersion });
		await mcp.connect(transport);

		const toolsResult = await mcp.listTools();
		debug(
			"Connected to server with tools:",
			toolsResult.tools.map(({ name }) => name),
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
			}),
		);
	}

	async *processSingleTurnWithTools(
		messages: ChatCompletionInputMessage[],
		opts: {
			exitLoopTools?: ChatCompletionInputTool[];
			exitIfFirstChunkNoTool?: boolean;
			abortSignal?: AbortSignal;
		} = {},
	): AsyncGenerator<ChatCompletionStreamOutput | ChatCompletionInputMessageTool> {
		debug("start of single turn");

		const stream = this.client.chatCompletionStream(
			{
				provider: this.provider,
				model: this.model,
				messages,
				tools: opts.exitLoopTools ? [...opts.exitLoopTools, ...this.availableTools] : this.availableTools,
				tool_choice: "auto",
			},
			{
				signal: opts.abortSignal,
			},
		);

		const message = {
			role: "unknown",
			content: "",
		} satisfies ChatCompletionInputMessage;
		const toolCallAccumulator = new ToolCallAccumulator();
		let numOfChunks = 0;

		for await (const chunk of stream) {
			if (opts.abortSignal?.aborted) {
				throw new Error("AbortError");
			}
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
				toolCallAccumulator.add(toolCall);
			}
			if (opts.exitIfFirstChunkNoTool && numOfChunks <= 2 && toolCallAccumulator.toolCalls.length === 0) {
				/// If no tool is present in chunk number 1 or 2, exit.
				return;
			}
			yield chunk;
		}

		const assistantMessage: ChatCompletionInputMessage = {
			role: "assistant",
			content: message.content,
		};

		const finalToolCallValues = toolCallAccumulator.toolCalls;

		if (finalToolCallValues.length > 0) {
			assistantMessage.tool_calls = finalToolCallValues.map((toolCall) => ({
				id: toolCall.id,
				type: "function",
				function: {
					name: toolCall.function.name ?? "unknown",
					arguments: toolCall.function.arguments,
				},
			}));
		}
		messages.push(assistantMessage);

		for (const toolCall of finalToolCallValues) {
			const toolName = toolCall.function.name ?? "unknown";
			/// TODO(Fix upstream type so this is always a string)^
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
			let toolArgs: Record<string, unknown> = {};
			try {
				toolArgs = toolCall.function.arguments === "" ? {} : JSON.parse(toolCall.function.arguments);
			} catch (error) {
				if (error instanceof SyntaxError) {
					toolMessage.content = `Invalid JSON generated by the model: ${error.message}`;
					messages.push(toolMessage);
					yield toolMessage;
					continue;
				} else {
					throw error;
				}
			}

			/// Get the appropriate session for this tool
			const client = this.clients.get(toolName);
			if (client) {
				try {
					const result = await client.callTool({ name: toolName, arguments: toolArgs, signal: opts.abortSignal });
					toolMessage.content = ResultFormatter.format(result);
				} catch (error) {
					toolMessage.content = `Error: MCP tool call failed with error message: ${error}`;
				}
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
