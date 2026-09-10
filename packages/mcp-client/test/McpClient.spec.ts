import { describe, expect, it } from "vitest";
import { McpClient } from "../src";
import type { InferenceClient } from "@huggingface/inference";
import type { ChatCompletionInputMessage } from "@huggingface/tasks/src/tasks/chat-completion/inference";

if (!process.env.HF_TOKEN) {
	console.warn("Set HF_TOKEN in the env to run the tests for better rate limits");
}

interface StubChunk {
	choices: Array<{ delta: Record<string, unknown> }>;
}

/**
 * `McpClient.client` is a protected member, so a subclass is the supported way to swap the
 * inference client for a stub. One entry of `turns` is consumed per `chatCompletionStream` call,
 * and the messages that call received are recorded in `seenMessages`.
 */
class StubbedMcpClient extends McpClient {
	readonly seenMessages: ChatCompletionInputMessage[][] = [];

	constructor(turns: StubChunk[][]) {
		super({ provider: "together", model: "test" });

		let turnIndex = 0;
		const seenMessages = this.seenMessages;
		this.client = {
			async *chatCompletionStream(args: { messages: ChatCompletionInputMessage[] }): AsyncGenerator<StubChunk> {
				seenMessages.push(structuredClone(args.messages));
				for (const chunk of turns[turnIndex] ?? []) {
					yield chunk;
				}
				turnIndex++;
			},
		} as unknown as InferenceClient;
	}
}

const toolCallChunk = (reasoning: string): StubChunk => ({
	choices: [
		{
			delta: {
				role: "assistant",
				reasoning_content: reasoning,
				tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "missing", arguments: "{}" } }],
			},
		},
	],
});

async function drain(client: McpClient, messages: ChatCompletionInputMessage[]): Promise<void> {
	for await (const event of client.processSingleTurnWithTools(messages)) {
		// Exhaust the generator so the assistant replay message is recorded.
		void event;
	}
}

describe("McpClient", () => {
	it("You can create a mcp client", async () => {
		const client = new McpClient({
			provider: "together",
			model: "Qwen/Qwen2.5-72B-Instruct",
			apiKey: process.env.HF_TOKEN,
		});
		expect(client).toBeDefined();
		expect(client.availableTools.length).toBe(0);
	});

	it("keeps streamed reasoning on the replayed assistant message", async () => {
		const client = new StubbedMcpClient([
			[{ choices: [{ delta: { role: "assistant", reasoning_content: "think " } }] }, toolCallChunk("more")],
		]);
		const messages: ChatCompletionInputMessage[] = [{ role: "user", content: "hello" }];

		await drain(client, messages);

		expect(messages[1]).toMatchObject({
			role: "assistant",
			content: "",
			reasoning_content: "think more",
		});
		expect(messages[1]).toHaveProperty("tool_calls");
	});

	it("sends the reasoning back to the model on the next round", async () => {
		const client = new StubbedMcpClient([
			[toolCallChunk("first thought")],
			[{ choices: [{ delta: { role: "assistant", content: "done" } }] }],
		]);
		const messages: ChatCompletionInputMessage[] = [{ role: "user", content: "hello" }];

		await drain(client, messages);
		await drain(client, messages);

		// The point of the fix: the second inference call must see the reasoning of the first round.
		const secondRoundInput = client.seenMessages[1];
		expect(secondRoundInput.map((m) => m.role)).toEqual(["user", "assistant", "tool"]);
		expect(secondRoundInput[1]).toMatchObject({
			role: "assistant",
			reasoning_content: "first thought",
		});
	});

	it("leaves a turn without reasoning byte-identical", async () => {
		const client = new StubbedMcpClient([[{ choices: [{ delta: { role: "assistant", content: "answer" } }] }]]);
		const messages: ChatCompletionInputMessage[] = [{ role: "user", content: "hello" }];

		await drain(client, messages);

		expect(messages[1]).toEqual({ role: "assistant", content: "answer" });
		expect(messages[1]).not.toHaveProperty("reasoning_content");
	});
});
