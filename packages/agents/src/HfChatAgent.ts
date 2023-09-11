import { templateOpenAssistant } from "./formats";
import { LLMFromHub } from "./llms";
import { defaultTools } from "./tools";
import type { Chat, Message, Tool } from "./types";
import type { LLM } from "./types";
import { AgentScratchpad } from "./AgentScratchpad";

export interface HfAgentConfig {
	llm: LLM;
	accessToken?: string;
	chatHistory?: Chat;
	chatFormat(inputs: { messages: Chat; preprompt?: string }, options?: unknown): string;
	tools?: Tool[];
	updateCallback?: (history: Chat) => void;
}

export class HfChatAgent {
	public accessToken: string;
	public llm: LLM;
	public chatHistory: Chat;
	public tools: Tool[];
	public chatFormat: (inputs: { messages: Chat; preprompt?: string }, options?: unknown) => string;
	public updateCallback: (history: Chat) => void;

	constructor({ accessToken, llm, tools, chatHistory, chatFormat, updateCallback }: HfAgentConfig) {
		this.accessToken = accessToken ?? "";
		this.llm = llm ?? LLMFromHub(accessToken);
		this.tools = tools ?? defaultTools;
		this.chatHistory = chatHistory ?? [];
		this.chatFormat = chatFormat ?? templateOpenAssistant;
		this.updateCallback = updateCallback ?? (() => {});
	}

	get formattedChat(): string {
		return this.chatFormat({ messages: this.chatHistory });
	}

	public appendMessage(message: Message): void {
		this.chatHistory = [...this.chatHistory, message];
		this.updateCallback(this.chatHistory);
	}

	public async chat(prompt: string, files?: FileList): Promise<Message> {
		const scratchpad = new AgentScratchpad({ agent: this, tools: this.tools, inputFile: files?.[0] });

		this.appendMessage({ from: "user", content: prompt, scratchpad: scratchpad });

		const answer = await scratchpad.run(prompt);

		this.appendMessage({
			from: "assistant",
			content: answer,
		});

		return { from: "assistant", content: answer };
	}

	public resetChat(): void {
		this.chatHistory = [];
	}
}
