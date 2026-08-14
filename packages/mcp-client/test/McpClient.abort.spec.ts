import { describe, expect, it } from "vitest";
import { Agent } from "../src";
import type { ChatCompletionInputMessage } from "@huggingface/tasks";

/**
 * Builds a fake `chatCompletionStream` that always resolves a single tool_call
 * for `toolName`, and calls `onStreamEnd` (if given) right after the last chunk
 * is yielded, i.e. after the streaming loop's own abort check has already run
 * once and won't run again before control moves into the tool-execution loop.
 */
function fakeStream(toolName: string, onStreamEnd?: () => void) {
	let callCount = 0;
	return {
		callCount: () => callCount,
		fn: function chatCompletionStream() {
			callCount++;
			const id = `call_${callCount}`;
			async function* gen() {
				yield {
					choices: [
						{
							delta: {
								role: "assistant",
								tool_calls: [{ index: 0, id, function: { name: toolName, arguments: "{}" } }],
							},
						},
					],
				};
				onStreamEnd?.();
			}
			return gen();
		},
	};
}

function makeAgent() {
	const agent = new Agent({ provider: "auto", model: "fake/fake-model", apiKey: "sk-fake", servers: [] });
	return agent;
}

async function drain(gen: AsyncGenerator<unknown>, maxSteps = 6) {
	const yielded: unknown[] = [];
	for (let i = 0; i < maxSteps; i++) {
		const { value, done } = await gen.next();
		if (done) {
			break;
		}
		yielded.push(value);
	}
	return yielded;
}

describe("McpClient abort handling", () => {
	it("stops the agent loop without starting another LLM turn when the tool call is aborted", async () => {
		const controller = new AbortController();
		const stream = fakeStream("myTool", () => controller.abort());
		const agent = makeAgent();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).client = { chatCompletionStream: stream.fn };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).clients.set("myTool", {
			callTool: async (_params: unknown, _resultSchema: unknown, options?: { signal?: AbortSignal }) => {
				if (options?.signal?.aborted) {
					throw new DOMException("The operation was aborted", "AbortError");
				}
				return { content: [{ type: "text", text: "tool ran" }] };
			},
		});

		const yielded = await drain(agent.run("do the thing", { abortSignal: controller.signal }));

		// only the assistant's tool_call chunk was yielded; the aborted tool call
		// never produced a "tool" message and no second LLM turn was started
		expect(yielded).toHaveLength(1);
		expect(stream.callCount()).toBe(1);
	});

	it("does not disguise an aborted tool call as a normal tool failure message", async () => {
		const controller = new AbortController();
		const stream = fakeStream("myTool", () => controller.abort());
		const agent = makeAgent();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).client = { chatCompletionStream: stream.fn };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).clients.set("myTool", {
			callTool: async (_params: unknown, _resultSchema: unknown, options?: { signal?: AbortSignal }) => {
				if (options?.signal?.aborted) {
					throw new DOMException("The operation was aborted", "AbortError");
				}
				return { content: [{ type: "text", text: "tool ran" }] };
			},
		});

		await drain(agent.run("do the thing", { abortSignal: controller.signal }));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const messages = (agent as any).messages as ChatCompletionInputMessage[];
		const toolMessages = messages.filter((m) => m.role === "tool");
		expect(toolMessages).toHaveLength(0);
	});

	it("passes the abort signal into the SDK call so a still-pending tool call settles as soon as it fires", async () => {
		const controller = new AbortController();
		const stream = fakeStream("myTool");
		const agent = makeAgent();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).client = { chatCompletionStream: stream.fn };
		let receivedSignal: AbortSignal | undefined;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).clients.set("myTool", {
			// never resolves on its own; only settles if the SDK actually forwards
			// the signal and something listens for its abort event
			callTool: (_params: unknown, _resultSchema: unknown, options?: { signal?: AbortSignal }) => {
				receivedSignal = options?.signal;
				return new Promise((_resolve, reject) => {
					options?.signal?.addEventListener("abort", () => {
						reject(new DOMException("The operation was aborted", "AbortError"));
					});
				});
			},
		});

		const iterator = agent.run("do the thing", { abortSignal: controller.signal })[Symbol.asyncIterator]();
		await iterator.next(); // assistant chunk

		const pending = iterator.next(); // resumes into the tool call, which now hangs
		await Promise.resolve(); // let the generator run up to its awaited callTool()
		expect(receivedSignal).toBe(controller.signal);

		controller.abort();
		const result = await pending;

		expect(result.done).toBe(true);
	});

	it("stops the agent loop even when the tool ignores the abort signal and resolves normally", async () => {
		const controller = new AbortController();
		const stream = fakeStream("myTool");
		const agent = makeAgent();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).client = { chatCompletionStream: stream.fn };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).clients.set("myTool", {
			// a tool that doesn't check `signal` at all and resolves after the
			// caller has already aborted (e.g. it was too far along to cancel)
			callTool: async () => {
				controller.abort();
				return { content: [{ type: "text", text: "tool ran despite abort" }] };
			},
		});

		const yielded = await drain(agent.run("do the thing", { abortSignal: controller.signal }));

		expect(yielded).toHaveLength(1);
		expect(stream.callCount()).toBe(1);
	});

	it("does not start the next tool call in the same turn once aborted between yields", async () => {
		// two tool calls in a single turn; abort lands right after the first
		// tool's message is yielded to the caller and before the second tool
		// is ever invoked
		const controller = new AbortController();
		const stream = {
			callCount: () => 1,
			fn: function chatCompletionStream() {
				async function* gen() {
					yield {
						choices: [
							{
								delta: {
									role: "assistant",
									tool_calls: [
										{ index: 0, id: "call_a", function: { name: "toolA", arguments: "{}" } },
										{ index: 1, id: "call_b", function: { name: "toolB", arguments: "{}" } },
									],
								},
							},
						],
					};
				}
				return gen();
			},
		};
		const agent = makeAgent();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).client = { chatCompletionStream: stream.fn };
		let toolBCalled = false;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).clients.set("toolA", {
			callTool: async () => ({ content: [{ type: "text", text: "a ran" }] }),
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).clients.set("toolB", {
			callTool: async () => {
				toolBCalled = true;
				return { content: [{ type: "text", text: "b ran" }] };
			},
		});

		const iterator = agent.run("do the thing", { abortSignal: controller.signal })[Symbol.asyncIterator]();
		await iterator.next(); // assistant chunk
		const toolAMessage = await iterator.next(); // toolA's tool message
		expect((toolAMessage.value as { name?: string }).name).toBe("toolA");

		controller.abort();
		const afterAbort = await iterator.next();

		expect(afterAbort.done).toBe(true);
		expect(toolBCalled).toBe(false);
	});

	it("leaves a normal (non-aborted) successful tool call flow unchanged", async () => {
		const stream = fakeStream("task_complete");
		const agent = makeAgent();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).client = { chatCompletionStream: stream.fn };

		const yielded = await drain(agent.run("do the thing"));

		expect(stream.callCount()).toBe(1);
		expect(yielded.some((v) => (v as { role?: string }).role === "tool")).toBe(true);
	});

	it("still surfaces a real (non-abort) tool error as a normal tool failure message and continues the loop", async () => {
		let turn = 0;
		const stream = {
			callCount: () => turn,
			fn: function chatCompletionStream() {
				turn++;
				const toolName = turn === 1 ? "myTool" : "task_complete";
				const id = `call_${turn}`;
				async function* gen() {
					yield {
						choices: [
							{
								delta: {
									role: "assistant",
									tool_calls: [{ index: 0, id, function: { name: toolName, arguments: "{}" } }],
								},
							},
						],
					};
				}
				return gen();
			},
		};
		const agent = makeAgent();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).client = { chatCompletionStream: stream.fn };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(agent as any).clients.set("myTool", {
			callTool: async () => {
				throw new Error("boom");
			},
		});

		const yielded = await drain(agent.run("do the thing"));

		const toolMessage = yielded.find((v) => (v as { role?: string }).role === "tool") as
			| { content?: string }
			| undefined;
		expect(toolMessage?.content).toContain("MCP tool call failed");
		expect(stream.callCount()).toBe(2);
	});
});
