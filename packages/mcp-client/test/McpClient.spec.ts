import { describe, expect, it } from "vitest";
import { McpClient } from "../src";

if (!process.env.HF_TOKEN) {
	console.warn("Set HF_TOKEN in the env to run the tests for better rate limits");
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
});

describe("McpClient.processSingleTurnWithTools: streamed tool calls", () => {
	/// One streamed `tool_calls` entry. OpenAI-compatible servers differ in what they send: `index` and `id` may be omitted
	interface Delta {
		index?: number;
		id?: string;
		name?: string;
		args?: string;
	}

	const delta = ({ index, id, name, args }: Delta) => ({
		...(index === undefined ? {} : { index }),
		...(id === undefined ? {} : { id }),
		type: "function",
		function: { ...(name === undefined ? {} : { name }), ...(args === undefined ? {} : { arguments: args }) },
	});

	const chunk = (toolCalls: Delta[], finishReason: string | null = null) => ({
		choices: [
			{ index: 0, delta: { role: "assistant", tool_calls: toolCalls.map(delta) }, finish_reason: finishReason },
		],
	});

	const END = chunk([], "tool_calls");

	/// Runs one turn against a mocked stream, with a `get_weather` MCP tool that records how it was called
	async function runTurn(chunks: unknown[]) {
		const mcp = new McpClient({ endpointUrl: "http://127.0.0.1:1", model: "mock" });
		const executed: unknown[] = [];
		Object.assign(mcp, {
			client: {
				async *chatCompletionStream() {
					for (const c of chunks) {
						yield c;
					}
				},
			},
		});
		(mcp as unknown as { clients: Map<string, unknown> }).clients.set("get_weather", {
			async callTool({ arguments: args }: { arguments: unknown }) {
				executed.push(args);
				return { content: [{ type: "text", text: `weather for ${JSON.stringify(args)}` }] };
			},
		});

		const messages: { role: string; tool_calls?: { id: string; function: { name: string; arguments: string } }[] }[] = [
			{ role: "user" },
		];
		const yielded: unknown[] = [];
		const toolMessages: { tool_call_id: string; name: string; content: string }[] = [];
		for await (const out of mcp.processSingleTurnWithTools(messages as never)) {
			if ("choices" in out) {
				/// what the caller sees at the time of the yield
				yielded.push(structuredClone(out));
			} else {
				toolMessages.push(out as never);
			}
		}
		const toolCalls = messages.find((m) => m.role === "assistant")?.tool_calls ?? [];
		return {
			executed,
			toolMessages,
			/// the tool calls of the assistant message pushed to the conversation
			toolCalls: toolCalls.map((t) => ({ id: t.id, name: t.function.name, arguments: t.function.arguments })),
			yielded,
		};
	}

	const PARIS = { city: "Paris" };
	const ROME = { city: "Rome" };

	it("assembles a call streamed the usual way (id + name first, arguments in fragments)", async () => {
		const chunks = [
			chunk([{ index: 0, id: "call_A", name: "get_weather", args: "" }]),
			chunk([{ index: 0, args: '{"city":' }]),
			chunk([{ index: 0, args: '"Paris"}' }]),
			END,
		];
		const { executed, toolCalls, toolMessages, yielded } = await runTurn(chunks);
		expect(toolCalls).toEqual([{ id: "call_A", name: "get_weather", arguments: '{"city":"Paris"}' }]);
		expect(executed).toEqual([PARIS]);
		expect(toolMessages.map((m) => m.tool_call_id)).toEqual(["call_A"]);
		/// the chunks are passed through as they were received
		expect(yielded).toEqual(chunks);
	});

	it("does not change a chunk it already yielded when later chunks arrive", async () => {
		const mcp = new McpClient({ endpointUrl: "http://127.0.0.1:1", model: "mock" });
		Object.assign(mcp, {
			client: {
				async *chatCompletionStream() {
					yield chunk([{ index: 0, id: "call_A", name: "get_weather" }]);
					yield chunk([{ index: 0, args: '{"city":"Paris"}' }]);
					yield END;
				},
			},
		});
		const kept: { choices: { delta: { tool_calls: { function: { arguments?: string } }[] } }[] }[] = [];
		for await (const out of mcp.processSingleTurnWithTools([{ role: "user", content: "hi" }])) {
			if ("choices" in out) {
				kept.push(out as never);
			}
		}
		/// no `arguments` was sent in the first chunk, and none must appear in it afterwards
		expect(kept[0].choices[0].delta.tool_calls[0].function.arguments).toBeUndefined();
		expect(kept[1].choices[0].delta.tool_calls[0].function.arguments).toBe('{"city":"Paris"}');
	});

	it("takes the name from a later chunk when the first one only has the id", async () => {
		const { executed, toolCalls, toolMessages } = await runTurn([
			chunk([{ index: 0, id: "call_A", args: "" }]),
			chunk([{ index: 0, name: "get_weather", args: '{"city":"Paris"}' }]),
			END,
		]);
		expect(toolCalls).toEqual([{ id: "call_A", name: "get_weather", arguments: '{"city":"Paris"}' }]);
		expect(executed).toEqual([PARIS]);
		expect(toolMessages.map((m) => m.name)).toEqual(["get_weather"]);
	});

	it("takes the id from a later chunk when the first one only has the name", async () => {
		const { executed, toolCalls } = await runTurn([
			chunk([{ index: 0, name: "get_weather", args: "" }]),
			chunk([{ index: 0, id: "call_A", args: '{"city":"Paris"}' }]),
			END,
		]);
		expect(toolCalls).toEqual([{ id: "call_A", name: "get_weather", arguments: '{"city":"Paris"}' }]);
		expect(executed).toEqual([PARIS]);
	});

	it("keeps two calls apart when the server re-uses index 0 for both", async () => {
		const { executed, toolCalls, toolMessages } = await runTurn([
			chunk([{ index: 0, id: "call_A", name: "get_weather", args: "" }]),
			chunk([{ index: 0, args: '{"city":"Paris"}' }]),
			chunk([{ index: 0, id: "call_B", name: "get_weather", args: "" }]),
			chunk([{ index: 0, args: '{"city":"Rome"}' }]),
			END,
		]);
		expect(toolCalls).toEqual([
			{ id: "call_A", name: "get_weather", arguments: '{"city":"Paris"}' },
			{ id: "call_B", name: "get_weather", arguments: '{"city":"Rome"}' },
		]);
		expect(executed).toEqual([PARIS, ROME]);
		expect(toolMessages.map((m) => m.tool_call_id)).toEqual(["call_A", "call_B"]);
	});

	it("keeps two calls apart when every chunk carries its call's id but all use index 0", async () => {
		const { executed, toolCalls } = await runTurn([
			chunk([{ index: 0, id: "call_A", name: "get_weather", args: "" }]),
			chunk([{ index: 0, id: "call_A", args: '{"city":"Paris"}' }]),
			chunk([{ index: 0, id: "call_B", name: "get_weather", args: "" }]),
			chunk([{ index: 0, id: "call_B", args: '{"city":"Rome"}' }]),
			END,
		]);
		expect(toolCalls.map((t) => t.id)).toEqual(["call_A", "call_B"]);
		expect(executed).toEqual([PARIS, ROME]);
	});

	it("handles servers that omit index, with each call sent whole", async () => {
		const { executed, toolCalls } = await runTurn([
			chunk([{ id: "call_A", name: "get_weather", args: '{"city":"Paris"}' }]),
			chunk([{ id: "call_B", name: "get_weather", args: '{"city":"Rome"}' }]),
			END,
		]);
		expect(toolCalls).toEqual([
			{ id: "call_A", name: "get_weather", arguments: '{"city":"Paris"}' },
			{ id: "call_B", name: "get_weather", arguments: '{"city":"Rome"}' },
		]);
		expect(executed).toEqual([PARIS, ROME]);
	});

	it("handles servers that omit index and id, with each call sent whole", async () => {
		const { executed, toolCalls } = await runTurn([
			chunk([{ name: "get_weather", args: '{"city":"Paris"}' }]),
			chunk([{ name: "get_weather", args: '{"city":"Rome"}' }]),
			END,
		]);
		expect(toolCalls.map((t) => t.arguments)).toEqual(['{"city":"Paris"}', '{"city":"Rome"}']);
		expect(executed).toEqual([PARIS, ROME]);
	});

	it("sends argument fragments that have neither id nor index to the most recent call", async () => {
		const { executed, toolCalls } = await runTurn([
			chunk([{ index: 0, id: "call_A", name: "get_weather", args: "" }]),
			chunk([{ args: '{"city":' }]),
			chunk([{ args: '"Paris"}' }]),
			chunk([{ index: 1, id: "call_B", name: "get_weather", args: "" }]),
			chunk([{ args: '{"city":"Rome"}' }]),
			END,
		]);
		expect(toolCalls).toEqual([
			{ id: "call_A", name: "get_weather", arguments: '{"city":"Paris"}' },
			{ id: "call_B", name: "get_weather", arguments: '{"city":"Rome"}' },
		]);
		expect(executed).toEqual([PARIS, ROME]);
	});

	it("keeps parallel calls apart when their chunks are interleaved by index", async () => {
		const { executed, toolCalls } = await runTurn([
			chunk([{ index: 0, id: "call_A", name: "get_weather", args: "" }]),
			chunk([{ index: 1, id: "call_B", name: "get_weather", args: "" }]),
			chunk([{ index: 0, args: '{"city":' }]),
			chunk([{ index: 1, args: '{"city":' }]),
			chunk([{ index: 1, args: '"Rome"}' }]),
			chunk([{ index: 0, args: '"Paris"}' }]),
			END,
		]);
		expect(toolCalls).toEqual([
			{ id: "call_A", name: "get_weather", arguments: '{"city":"Paris"}' },
			{ id: "call_B", name: "get_weather", arguments: '{"city":"Rome"}' },
		]);
		expect(executed).toEqual([PARIS, ROME]);
	});

	it("keeps parallel calls apart when two of them arrive in the same chunk", async () => {
		const { executed, toolCalls } = await runTurn([
			chunk([
				{ index: 0, id: "call_A", name: "get_weather", args: "" },
				{ index: 1, id: "call_B", name: "get_weather", args: "" },
			]),
			chunk([
				{ index: 0, args: '{"city":"Paris"}' },
				{ index: 1, args: '{"city":"Rome"}' },
			]),
			END,
		]);
		expect(toolCalls.map((t) => t.arguments)).toEqual(['{"city":"Paris"}', '{"city":"Rome"}']);
		expect(executed).toEqual([PARIS, ROME]);
	});

	it("appends a name that is streamed in fragments, and ignores a name repeated in full", async () => {
		const fragments = await runTurn([
			chunk([{ index: 0, id: "call_A", name: "get_", args: "" }]),
			chunk([{ index: 0, name: "weather", args: '{"city":"Paris"}' }]),
			END,
		]);
		expect(fragments.toolCalls[0].name).toBe("get_weather");
		expect(fragments.executed).toEqual([PARIS]);

		const repeated = await runTurn([
			chunk([{ index: 0, id: "call_A", name: "get_weather", args: "" }]),
			chunk([{ index: 0, name: "get_weather", args: '{"city":' }]),
			chunk([{ index: 0, id: "call_A", name: "get_weather", args: '"Paris"}' }]),
			END,
		]);
		expect(repeated.toolCalls).toEqual([{ id: "call_A", name: "get_weather", arguments: '{"city":"Paris"}' }]);
		expect(repeated.executed).toEqual([PARIS]);
	});

	it("joins arguments split over many chunks", async () => {
		const pieces = ["{", '"ci', 'ty"', ":", ' "Pa', 'ris"', "}"];
		const { executed, toolCalls } = await runTurn([
			chunk([{ index: 0, id: "call_A", name: "get_weather", args: "" }]),
			...pieces.map((args) => chunk([{ index: 0, args }])),
			END,
		]);
		expect(toolCalls[0].arguments).toBe('{"city": "Paris"}');
		expect(executed).toEqual([PARIS]);
	});

	it("calls a tool with no arguments, whether they are empty or never sent", async () => {
		const empty = await runTurn([chunk([{ index: 0, id: "call_A", name: "get_weather", args: "" }]), END]);
		expect(empty.toolCalls).toEqual([{ id: "call_A", name: "get_weather", arguments: "" }]);
		expect(empty.executed).toEqual([{}]);

		const missing = await runTurn([chunk([{ index: 0, id: "call_A", name: "get_weather" }]), END]);
		expect(missing.toolCalls).toEqual([{ id: "call_A", name: "get_weather", arguments: "" }]);
		expect(missing.executed).toEqual([{}]);
	});

	it("ignores a final chunk that only has usage", async () => {
		const { executed, toolCalls } = await runTurn([
			chunk([{ index: 0, id: "call_A", name: "get_weather", args: '{"city":"Paris"}' }]),
			END,
			{ choices: [], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } },
		]);
		expect(toolCalls).toHaveLength(1);
		expect(executed).toEqual([PARIS]);
	});

	it("still reports a call to an unknown tool, and invalid JSON, per call", async () => {
		const { executed, toolMessages } = await runTurn([
			chunk([
				{ index: 0, id: "call_A", name: "no_such_tool", args: "{}" },
				{ index: 1, id: "call_B", name: "get_weather", args: '{"city":' },
			]),
			END,
		]);
		expect(executed).toEqual([]);
		expect(toolMessages[0].content).toBe("Error: No session found for tool: no_such_tool");
		expect(toolMessages[1].content).toMatch(/^Invalid JSON /);
	});
});
