import { templateOpenAssistant } from "./formats";
import { LLMFromHub } from "./llms";
import { defaultTools } from "./tools";
import type { Chat, Message, Tool, Update } from "./types";
import type { LLM } from "./types";
import { AgentScratchpad } from "./AgentScratchpad";
import type { TextGenerationStreamOutput } from "@huggingface/inference";

export interface Callbacks {
	onMessage?: (message: Message) => void;
	onUpdate?: (update: Update) => void;
	onScratch?: (scratch: Message) => void;
	onFile?: (file: Blob, tool?: Tool) => void;
	onStream?: (output: TextGenerationStreamOutput) => void;
	onFinalAnswer?: (output: string) => void;
	onError?: (error: Error) => void;
}
export interface HfAgentConfig {
	llm: LLM;
	accessToken?: string;
	chatHistory?: Chat;
	chatFormat(inputs: { messages: Chat }, options?: unknown): string;
	tools?: Tool[];
	callbacks?: Callbacks;
}

export class HfChatAgent {
	public accessToken: string;
	public llm: LLM;
	public chatHistory: Chat;
	public tools: Tool[];
	public chatFormat: (inputs: { messages: Chat }, options?: unknown) => string;
	public callbacks?: Callbacks;

	constructor({ accessToken, llm, tools, chatHistory, chatFormat, callbacks }: HfAgentConfig) {
		this.accessToken = accessToken ?? "";
		this.llm = llm ?? LLMFromHub(accessToken);
		this.tools = tools ?? defaultTools;
		this.chatHistory = chatHistory ?? [];
		this.chatFormat = chatFormat ?? templateOpenAssistant;
		this.callbacks = callbacks ?? {};
	}

	get LLMNoStream(): (text: string) => Promise<string> {
		return async (text: string): Promise<string> => {
			const response = await this.llm(text);
			for await (const output of response) {
				// if not generated_text is here it means the generation is not done
				if (output.generated_text) {
					return output.generated_text;
				}
			}
			throw new Error("No generated text");
		};
	}

	get LLMStream(): (text: string) => Promise<string> {
		return async (text: string): Promise<string> => {
			const response = await this.llm(text);
			for await (const output of response) {
				this.callbacks?.onStream?.(output);
				if (output.generated_text) {
					return output.generated_text;
				}
			}
			throw new Error("No generated text");
		};
	}

	get formattedChat(): string {
		return this.chatFormat({ messages: this.chatHistory });
	}

	public appendMessage(message: Message): void {
		this.chatHistory = [...this.chatHistory, message];
		this.callbacks?.onMessage?.(message);
	}

	public async chat(prompt: string, files?: FileList): Promise<Message> {
		const scratchpad = new AgentScratchpad({ agent: this, tools: this.tools, inputFile: files?.[0] });

		this.appendMessage({ from: "user", content: prompt, scratchpad: scratchpad });

		let text = prompt;
		if (files?.[0] !== undefined) {
			text += "[[input]]";
		}

		const answer = await scratchpad.run(text);

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
