import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { ANSI } from "./utils";
import type { ChatCompletionStreamOutput } from "@huggingface/tasks";
import type { Agent } from "../index";

/**
 * From mcp-client/cli.ts,
 * minus the agent.loadTools() done upstream.
 */
export async function mainCliLoop(agent: Agent): Promise<void> {
	const rl = readline.createInterface({ input: stdin, output: stdout });
	let abortController = new AbortController();
	let waitingForInput = false;
	async function waitForInput() {
		waitingForInput = true;
		const input = await rl.question("> ");
		waitingForInput = false;
		return input;
	}
	rl.on("SIGINT", async () => {
		if (waitingForInput) {
			// close the whole process
			await agent.cleanup();
			stdout.write("\n");
			rl.close();
		} else {
			// otherwise, it means a request is underway
			abortController.abort();
			abortController = new AbortController();
			stdout.write("\n");
			stdout.write(ANSI.GRAY);
			stdout.write("Ctrl+C a second time to exit");
			stdout.write(ANSI.RESET);
			stdout.write("\n");
		}
	});
	process.on("uncaughtException", (err) => {
		stdout.write("\n");
		rl.close();
		throw err;
	});

	stdout.write(ANSI.BLUE);
	stdout.write(`Agent loaded with ${agent.availableTools.length} tools:\n`);
	stdout.write(agent.availableTools.map((t) => `- ${t.function.name}`).join("\n"));
	stdout.write(ANSI.RESET);
	stdout.write("\n");

	while (true) {
		const input = await waitForInput();
		for await (const chunk of agent.run(input, { abortSignal: abortController.signal })) {
			if ("choices" in chunk) {
				const delta = (chunk as ChatCompletionStreamOutput).choices[0]?.delta;
				if (delta.content) {
					stdout.write(delta.content);
				}
				if (delta.tool_calls) {
					stdout.write(ANSI.GRAY);
					for (const deltaToolCall of delta.tool_calls) {
						if (deltaToolCall.id) {
							stdout.write(`<Tool ${deltaToolCall.id}>\n`);
						}
						if (deltaToolCall.function.name) {
							stdout.write(deltaToolCall.function.name + " ");
						}
						if (deltaToolCall.function.arguments) {
							stdout.write(deltaToolCall.function.arguments);
						}
					}
					stdout.write(ANSI.RESET);
				}
			} else {
				/// Tool call info
				stdout.write("\n\n");
				stdout.write(ANSI.GREEN);
				stdout.write(`Tool[${chunk.name}] ${chunk.tool_call_id}\n`);
				stdout.write(chunk.content);
				stdout.write(ANSI.RESET);
				stdout.write("\n\n");
			}
		}
		stdout.write("\n");
	}
}
