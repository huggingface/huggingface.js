import { templateFinalAnswer, templateOpenAssistant } from "./formats";
import { templateToolCheck, templateToolPlan, templateToolStep } from "./formats";
import { LLMFromHub } from "./llms";
import { defaultTools } from "./tools";
import type { Chat, Data, Message, Tool } from "./types";
import type { LLM } from "./types";
import { extractJSON } from "./utils/textFormatting";
import { HfInference } from "@huggingface/inference";
import { isBlob } from "./utils/files";

export interface HfAgentConfig {
	llm: LLM;
	accessToken?: string;
	chatHistory?: Chat;
	chatFormat(inputs: { messages: Chat }, options?: unknown): string;
	tools?: Tool[];
}

export class HfChatAgent {
	private accessToken: string;
	private llm: LLM;
	private chatHistory: Message[];
	private tools: Tool[];
	private chatFormat: (inputs: { messages: Chat }, options?: unknown) => string;
	private maxTry = 3;

	constructor({ accessToken, llm, tools, chatHistory, chatFormat }: HfAgentConfig) {
		this.accessToken = accessToken ?? "";
		this.llm = llm ?? LLMFromHub(accessToken);
		this.tools = tools ?? defaultTools;
		this.chatHistory = chatHistory ?? [];
		this.chatFormat = chatFormat ?? templateOpenAssistant;
	}

	get formattedChat(): string {
		return this.chatFormat({ messages: this.chatHistory });
	}

	private async shouldUseTool(message: Message): Promise<boolean> {
		if (message.scratchpad === undefined) {
			message.scratchpad = [];
		}

		let tries = 0;

		const toolCheckPrompt = templateToolCheck({
			prompt: message.content,
			image: message.image !== undefined,
			audio: message.audio !== undefined,
			tools: this.tools,
		});

		message.scratchpad = [...message.scratchpad, { from: "user", content: toolCheckPrompt, scratchpad: [] }];

		while (tries < this.maxTry) {
			const useATool: string = await this.llm(this.chatFormat({ messages: message.scratchpad }));

			message.scratchpad = [...message.scratchpad, { from: "assistant", content: useATool }];

			if (useATool.toLowerCase().trim().startsWith("yes")) {
				return true;
			} else if (useATool.toLowerCase().trim().startsWith("no")) {
				return false;
			} else {
				tries += 1;
				message.scratchpad = [
					...message.scratchpad,
					{ from: "user", content: "Your answer MUST start with YES or NO only." },
				];
			}
		}
		throw new Error("You have exceeded the maximum number of tries.");
	}

	private async planAndExecute(message: Message): Promise<string> {
		if (message.scratchpad === undefined) {
			message.scratchpad = [];
		}

		// ask the LLM about its plan using tools
		const toolPlanPrompt = templateToolPlan({
			prompt: message.content,
			image: message.image !== undefined,
			audio: message.audio !== undefined,
			tools: this.tools,
		});
		message.scratchpad = [...message.scratchpad, { from: "user", content: toolPlanPrompt, scratchpad: [] }];

		// get the response from the LLM
		const toolPlan: string = await this.llm(this.chatFormat({ messages: message.scratchpad }));
		message.scratchpad = [...message.scratchpad, { from: "assistant", content: toolPlan }];

		return toolPlan;
	}

	private async getToolInput(message: Message, toolsUsed: Tool[]): Promise<{ input: Data; tool: string }> {
		if (message.scratchpad === undefined) {
			message.scratchpad = [];
		}

		let tries = 0;

		// then ask which tool to call first
		const toolStepPrompt = templateToolStep({
			prompt: message.content,
			image: message.image !== undefined,
			audio: message.audio !== undefined,
			tools: toolsUsed,
		});
		message.scratchpad = [...message.scratchpad, { from: "user", content: toolStepPrompt, scratchpad: [] }];

		while (tries < this.maxTry) {
			try {
				// get the response
				const toolStep: string = await this.llm(this.chatFormat({ messages: message.scratchpad }));
				message.scratchpad = [...message.scratchpad, { from: "assistant", content: toolStep }];

				const json = JSON.parse(extractJSON(toolStep));

				if (json["tool"] === undefined || json["input"] === undefined) {
					throw new Error("The tool response must contain the tool name and input.");
				}

				return json;
			} catch (error) {
				tries += 1;
				message.scratchpad = [
					...message.scratchpad,
					{
						from: "user",
						content: `A valid JSON was not found in your answer. The JSON must match the format \n \`\`\`{ "tool":"tool name",\n "input" : "the input for that tool"}\`\`\`.`,
					},
				];
			}
		}

		throw new Error("You have exceeded the maximum number of tries.");
	}

	private async callTool(message: Message, tool: Tool, input: Data) {
		if (tool.call === undefined) {
			throw new Error("The tool does not have a call function.");
		}

		if (message.scratchpad === undefined) {
			message.scratchpad = [];
		}

		// get the response
		const toolResponse = await tool.call(input, new HfInference(this.accessToken ?? ""));

		if (isBlob(toolResponse)) {
			message.scratchpad = [
				...message.scratchpad,
				{ from: "user", content: "The tool returned the associated content.", image: toolResponse },
			];
		} else {
			message.scratchpad = [...message.scratchpad, { from: "assistant", content: toolResponse }];
		}
	}

	private async getFinalAnswer(message: Message) {
		if (message.scratchpad === undefined) {
			message.scratchpad = [];
		}

		// ask the LLM about its plan using tools
		const finalAnswerPrompt = templateFinalAnswer({
			prompt: message.content,
		});
		message.scratchpad = [...message.scratchpad, { from: "user", content: finalAnswerPrompt, scratchpad: [] }];

		// get the response from the LLM
		const finalAnswer: string = await this.llm(this.chatFormat({ messages: message.scratchpad }));
		message.scratchpad = [...message.scratchpad, { from: "assistant", content: finalAnswer }];

		return finalAnswer;
	}
	public async chat(prompt: string, files?: FileList): Promise<Message> {
		this.chatHistory.push({
			from: "user",
			content: prompt,
			image: !!files && files[0].type.startsWith("image") ? (files[0] as Blob) : undefined,
			audio: !!files && files[0].type.startsWith("audio") ? (files[0] as Blob) : undefined,
			scratchpad: [],
		});

		const useTools = await this.shouldUseTool(this.chatHistory[this.chatHistory.length - 1]);

		if (useTools) {
			const plan = await this.planAndExecute(this.chatHistory[this.chatHistory.length - 1]); // something with tools

			const toolsUsed = this.tools.filter((tool) => plan.includes(tool.name));

			let tries = 0;

			while (tries < this.maxTry) {
				const toolInput = await this.getToolInput(this.chatHistory[this.chatHistory.length - 1], toolsUsed);
				tries += 1;

				// if the tool is finalAnswer, we know we're done
				if (toolInput["tool"] === "finalAnswer") {
					// check if the result is an image or text and act accordingly
					if (isBlob(toolInput["input"])) {
						this.chatHistory = [
							...this.chatHistory,
							{ from: "assistant", content: "final answer", image: toolInput["input"] },
						];
					} else {
						this.chatHistory = [...this.chatHistory, { from: "assistant", content: toolInput["input"] }];
					}
					return this.chatHistory[this.chatHistory.length - 1];
				}

				// else, we call the tool
				const tool = this.tools.find((tool) => tool.name === toolInput["tool"]);

				if (tool === undefined || tool.call === undefined) {
					throw new Error("The tool name is not valid.");
				}

				// if the input is [[input]] we sub the actual embedded file
				const input = toolInput["input"] === "[[input]]" && files ? files[0] : toolInput["input"];
				const toolResult = await this.callTool(this.chatHistory[this.chatHistory.length - 1], tool, input);
			}

			const finalAnswer = await this.getFinalAnswer(this.chatHistory[this.chatHistory.length - 1]);
			console.log(finalAnswer);
			this.chatHistory = [...this.chatHistory, { from: "assistant", content: finalAnswer }];
		} else {
			// no tools, push prompt directly and get response
			this.chatHistory.push({ from: "user", content: prompt });
			const response = await this.llm(this.formattedChat);
			this.chatHistory.push({ from: "assistant", content: response });
		}
		return this.chatHistory[this.chatHistory.length - 1];
	}
}
