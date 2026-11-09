import { afterEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type {
	ChatCompletionInputMessage,
	ChatCompletionStreamOutput,
} from "@huggingface/tasks/src/tasks/chat-completion/inference";
import { McpClient } from "../src";

vi.mock("@huggingface/inference", () => ({
	InferenceClient: class {
		async *chatCompletionStream(): AsyncGenerator<ChatCompletionStreamOutput> {
			yield {
				id: "completion-1",
				created: 0,
				model: "test-model",
				system_fingerprint: "test",
				choices: [
					{
						index: 0,
						delta: {
							role: "assistant",
							tool_calls: [
								{
									id: "call-1",
									index: 0,
									type: "function",
									function: { name: "read_file", arguments: '{"path":"missing.txt"}' },
								},
							],
						},
					},
				],
			};
		}
	},
}));

describe("McpClient tool results", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it.each([
		{ isError: true, content: "file not found", expected: "Error: MCP tool returned isError=true\nfile not found" },
		{ isError: false, content: "File contents", expected: "File contents" },
		{ isError: undefined, content: "File contents", expected: "File contents" },
	])("passes isError=$isError results to the model conversation", async ({ isError, content, expected }) => {
		vi.spyOn(Client.prototype, "connect").mockResolvedValue(undefined);
		vi.spyOn(Client.prototype, "listTools").mockResolvedValue({
			tools: [{ name: "read_file", inputSchema: { type: "object" } }],
		});
		const callTool = vi.spyOn(Client.prototype, "callTool").mockResolvedValue({
			isError,
			content: [{ type: "text", text: content }],
		});
		const client = new McpClient({ endpointUrl: "https://example.com/inference", model: "test-model" });
		await client.addMcpServer({ type: "http", config: { url: "https://example.com/mcp" } });
		const messages: ChatCompletionInputMessage[] = [{ role: "user", content: "Read missing.txt" }];
		const outputs = [];

		for await (const output of client.processSingleTurnWithTools(messages)) {
			outputs.push(output);
		}

		const toolMessage = {
			role: "tool",
			tool_call_id: "call-1",
			name: "read_file",
			content: expected,
		};
		expect(callTool).toHaveBeenCalledOnce();
		expect(callTool).toHaveBeenCalledWith({ name: "read_file", arguments: { path: "missing.txt" }, signal: undefined });
		expect(outputs[outputs.length - 1]).toEqual(toolMessage);
		expect(messages[messages.length - 1]).toEqual(toolMessage);
	});
});
