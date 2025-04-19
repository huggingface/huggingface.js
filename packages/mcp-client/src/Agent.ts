import type { InferenceProvider } from "@huggingface/inference";
import type { ChatCompletionInputMessageTool } from "./McpClient";
import { McpClient } from "./McpClient";
import type { ChatCompletionInputMessage, ChatCompletionOutput } from "@huggingface/tasks";
import type { ChatCompletionInputTool } from "@huggingface/tasks/src/tasks/chat-completion/inference";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio";
import { debug } from "./utils";

const DEFAULT_SYSTEM_PROMPT = `
You are an agent - please keep going until the user’s query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the problem is solved, or if you need more info from the user to solve the problem.

If you are not sure about anything pertaining to the user’s request, use your tools to read files and gather the relevant information: do NOT guess or make up an answer.

You MUST plan extensively before each function call, and reflect extensively on the outcomes of the previous function calls. DO NOT do this entire process by making function calls only, as this can impair your ability to solve the problem and think insightfully.
`.trim();

/**
 * Max number of tool calling + chat completion steps in response to a single user query.
 */
const MAX_NUM_TURNS = 10;

const taskCompletionTool: ChatCompletionInputTool = {
	type: "function",
	function: {
		name: "task_complete",
		description: "Call this tool when the task given by the user is complete",
		parameters: {
			type: "object",
			properties: {},
		},
	},
};

export class Agent extends McpClient {
	private readonly servers: StdioServerParameters[];
	protected messages: ChatCompletionInputMessage[];

	constructor({
		provider,
		model,
		apiKey,
		servers,
	}: {
		provider: InferenceProvider;
		model: string;
		apiKey: string;
		servers: StdioServerParameters[];
	}) {
		super({ provider, model, apiKey });
		this.servers = servers;
		this.messages = [
			{
				role: "system",
				content: DEFAULT_SYSTEM_PROMPT,
			},
		];
	}

	async loadTools(): Promise<void> {
		return this.addMcpServers(this.servers);
	}

	async *run(input: string): AsyncGenerator<ChatCompletionOutput | ChatCompletionInputMessageTool> {
		this.messages.push({
			role: "user",
			content: input,
		});

		let i = 0;
		while (
			!(this.messages.at(-1)?.role === "tool" && this.messages.at(-1)?.name === taskCompletionTool.function.name) &&
			i < MAX_NUM_TURNS
		) {
			yield* this.processSingleTurnWithTools(this.messages, {
				taskCompletionTool,
			});
			i++;
			debug("current role", this.messages.at(-1)?.role);
		}
	}
}
