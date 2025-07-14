import type { InferenceProviderOrPolicy } from "@huggingface/inference";
import type { ChatCompletionInputMessageTool } from "./McpClient";
import { McpClient } from "./McpClient";
import type { ChatCompletionInputMessage, ChatCompletionStreamOutput } from "@huggingface/tasks";
import type { ChatCompletionInputTool } from "@huggingface/tasks/src/tasks/chat-completion/inference";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio";
import { debug } from "./utils";
import type { ServerConfig } from "./types";

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
			properties: {
				trigger: {
					type: "boolean",
					description: "Set to true to trigger this function",
				},
			},
		},
	},
};
const askQuestionTool: ChatCompletionInputTool = {
	type: "function",
	function: {
		name: "ask_question",
		description: "Ask a question to the user to get more info required to solve or clarify their problem.",
		parameters: {
			type: "object",
			properties: {
				trigger: {
					type: "boolean",
					description: "Set to true to trigger this function",
				},
			},
		},
	},
};
const exitLoopTools = [taskCompletionTool, askQuestionTool];

export class Agent extends McpClient {
	private readonly servers: (ServerConfig | StdioServerParameters)[];
	public readonly prompt: string;
	protected messages: ChatCompletionInputMessage[];

	constructor({
		provider,
		endpointUrl,
		model,
		apiKey,
		servers,
		prompt,
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
		servers: (ServerConfig | StdioServerParameters)[];
		prompt?: string;
	}) {
		super(provider ? { provider, endpointUrl, model, apiKey } : { provider, endpointUrl, model, apiKey });
		/// ^This shenanigan is just here to please an overzealous TS type-checker.
		this.servers = servers;
		this.prompt = prompt ?? DEFAULT_SYSTEM_PROMPT;
		this.messages = [
			{
				role: "system",
				content: this.prompt,
			},
		];
	}

	async loadTools(): Promise<void> {
		return this.addMcpServers(this.servers);
	}

	async *run(
		input: string | ChatCompletionInputMessage[],
		opts: { abortSignal?: AbortSignal } = {}
	): AsyncGenerator<ChatCompletionStreamOutput | ChatCompletionInputMessageTool> {
		let messages: ChatCompletionInputMessage[];
		if (typeof input === "string") {
			/// Use internal array of messages
			this.messages.push({
				role: "user",
				content: input,
			});
			messages = this.messages;
		} else {
			/// Use the passed messages directly
			messages = input;
		}

		let numOfTurns = 0;
		let nextTurnShouldCallTools = true;
		while (true) {
			try {
				yield* this.processSingleTurnWithTools(messages, {
					exitLoopTools,
					exitIfFirstChunkNoTool: numOfTurns > 0 && nextTurnShouldCallTools,
					abortSignal: opts.abortSignal,
				});
			} catch (err) {
				if (err instanceof Error && err.message === "AbortError") {
					return;
				}
				throw err;
			}
			numOfTurns++;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const currentLast = messages.at(-1)!;
			debug("current role", currentLast.role);
			if (
				currentLast.role === "tool" &&
				currentLast.name &&
				exitLoopTools.map((t) => t.function.name).includes(currentLast.name)
			) {
				return;
			}
			if (currentLast.role !== "tool" && numOfTurns > MAX_NUM_TURNS) {
				return;
			}
			if (currentLast.role !== "tool" && nextTurnShouldCallTools) {
				return;
			}
			if (currentLast.role === "tool") {
				nextTurnShouldCallTools = false;
			} else {
				nextTurnShouldCallTools = true;
			}
		}
	}
}
