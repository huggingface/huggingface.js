import { HfInference } from "@huggingface/inference";
import { templateFinalAnswer, templateToolCheck, templateToolStep } from "./formats";
import type { HfChatAgent } from "./HfChatAgent";
import type { Data, Files, Message, Tool, Update } from "./types";
import { isBlob } from "./utils/files";
import { extractJSON } from "./utils/textFormatting";

export class AgentScratchpad {
	agent: HfChatAgent;
	scratch: Message[];
	public updates: Update[];
	files: Files;
	tools: Tool[];
	maxTry = 3;
	maxTools = 1;

	constructor({ agent, tools, inputFile }: { agent: HfChatAgent; tools: Tool[]; inputFile?: Data }) {
		this.agent = agent;
		this.scratch = [];
		this.updates = [];
		this.tools = tools;
		this.files = inputFile ? { input: inputFile } : {};

		// get files that appear in the body answer of previous chats
		const pastFiles = this.agent.chatHistory
			.filter((message) => !!message.scratchpad && Object.values(message.scratchpad.files).length > 0)
			.reduce((acc, message) => {
				if (message.scratchpad) {
					const keysInBody = Object.keys(message.scratchpad.files).filter((key) => message.content.includes(key));

					acc = [...acc, ...(keysInBody.map((key) => message.scratchpad?.files[key]) as Data[])];
				}
				return acc;
			}, [] as Data[]);

		pastFiles.forEach((file, n) => {
			this.files[`chat-${n}`] = file;
		});
	}

	get formattedScratchpad(): string {
		return this.agent.chatFormat({ messages: [...this.agent.chatHistory, ...this.scratch] });
	}

	private pushUpdate(update: Update): void {
		this.updates = [...this.updates, update];
		this.agent.callbacks?.onUpdate?.(update);
	}

	private appendScratchpad(message: Message): void {
		this.scratch = [...this.scratch, message];
		this.agent.callbacks?.onScratch?.(message);
	}

	private async askTemplate<T>(template: (inputs: T) => string, inputs: T, stream?: boolean): Promise<string> {
		const llm = stream ? this.agent.LLMStream : this.agent.LLMNoStream;

		const templatePrompt = template(inputs);
		this.appendScratchpad({ from: "user", content: templatePrompt });
		const answer = await llm(this.formattedScratchpad);
		this.appendScratchpad({ from: "assistant", content: answer });

		return answer;
	}

	private async askTemplateWithRetry<TemplateParams, RetryParams, ValidatorOutput>(
		template: (inputs: TemplateParams) => string,
		inputs: TemplateParams,
		validator: (answer: string) => ValidatorOutput,
		stream?: boolean,
		retryTemplate?: (inputs: RetryParams) => string,
		retryInputs?: RetryParams
	) {
		let tries = 0;

		while (tries < this.maxTry) {
			try {
				const answer = await this.askTemplate(template, inputs, stream);
				const validation = validator(answer);
				return validation;
			} catch (e) {
				console.error(e);
				tries += 1;
				if (retryTemplate === undefined || retryInputs === undefined) {
					continue;
				}
				await this.askTemplate(retryTemplate, retryInputs, stream);
			}
		}

		throw new Error("Max tries exceeded");
	}

	public async run(prompt: string): Promise<string> {
		let files = this.files;

		let useTool = false;
		if (files.input) {
			useTool = true; // if the user input a file, they always want a tool
		} else if (this.tools.length === 0) {
			useTool = false;
		} else {
			this.pushUpdate({ stepType: "toolCheck", message: "Checking for tool use" });
			const toolCheckValidator = (answer: string) => {
				if (answer.toLowerCase().trim().startsWith("yes")) {
					return true;
				} else if (answer.toLowerCase().trim().startsWith("no")) {
					return false;
				} else {
					throw new Error("Invalid answer");
				}
			};

			useTool = await this.askTemplateWithRetry(
				templateToolCheck,
				{
					prompt,
					files,
					tools: this.tools,
				},
				toolCheckValidator
			);
		}

		if (useTool) {
			this.pushUpdate({ stepType: "toolCheck", message: "A tool is required." });

			// const plan = await this.askTemplate(templateToolPlan, {
			// 	prompt,
			// 	files,
			// 	tools: this.tools,
			// });

			// const toolsUsed = this.tools.filter((tool) => plan.includes(tool.name));

			// this.pushUpdate({
			// 	stepType: "plan",
			// 	message: "Using the following tools: " + toolsUsed.map((tool) => tool.name).join(", "),
			// });

			const toolValidator = (answer: string) => {
				const json = JSON.parse(extractJSON(answer));

				if (json["tool"] === undefined || json["input"] === undefined) {
					throw new Error("The tool response must contain the tool name and input.");
				}

				if (json["tool"] === "finalAnswer") {
					return json;
				}

				const tool = this.tools.find((tool) => tool.name === json["tool"]);

				if (tool === undefined || tool.call === undefined) {
					throw new Error("The tool name is not valid.");
				}

				return json;
			};

			let tools = 0;
			while (tools < this.maxTools) {
				const toolInput = await this.askTemplateWithRetry(
					templateToolStep,
					{
						prompt,
						files,
						tools: this.tools,
					},
					toolValidator
				);

				if (toolInput["tool"] === "finalAnswer") {
					this.agent.callbacks?.onFinalAnswer?.(toolInput["input"]);
					return toolInput["input"];
				} else {
					const tool = this.tools.find((tool) => tool.name === toolInput["tool"]);
					if (tool === undefined || tool.call === undefined) {
						throw new Error("The tool name is not valid.");
					}

					// go through this.files and if [[name]] matches a key, replace it with the value
					// then call the tool
					const matchingFiles = Object.keys(this.files).filter((key) => "[[" + key + "]]" === toolInput["input"]);

					let input = undefined;

					if (matchingFiles.length === 0) {
						input = toolInput["input"];
					} else {
						input = this.files[matchingFiles[0]];
					}

					this.pushUpdate({
						stepType: "toolInput",
						message: `Calling tool ${tool.name} with input: "${toolInput["input"]}"`,
					});

					let toolOutput = undefined;
					try {
						toolOutput = await tool.call(input, new HfInference(this.agent.accessToken ?? ""));
					} catch (e: unknown) {
						if (e instanceof Error) {
							this?.agent?.callbacks?.onError?.(e);
							toolOutput = "ERROR: " + e.message;
						} else {
							toolOutput = "Unknown error while calling the tool.";
						}
					}

					if (isBlob(toolOutput)) {
						this?.agent?.callbacks?.onFile?.(toolOutput, tool);

						this.files["tool-" + tools] = toolOutput;
						files = this.files;

						this.appendScratchpad({
							from: "user",
							content: "The tool has returned a file. You can reference it using [[tool-" + tools + "]]",
						});
					} else {
						this.appendScratchpad({ from: "user", content: "The tool has returned the following: " + toolOutput });
					}
					tools += 1;
					if (tool.name === "webSearch") {
						// can only call websearch once
						this.tools = this.tools.filter((tool) => tool.name !== "webSearch");
					}
				}
			}

			// final answer
			// const finalAnswerValidator = (answer: string) => {
			// 	const json = JSON.parse(extractJSON(answer));

			// 	if (json["tool"] !== "finalAnswer") {
			// 		throw new Error("The tool response must contain the tool name and input.");
			// 	}

			// 	return json["input"];
			// };

			// this.pushUpdate({
			// 	stepType: "finalAnswer",
			// 	message: `Maximum tools reached, asking for final answer.`,
			// });

			// ask for final answer here
			const finalAnswer = await this.askTemplate(
				templateFinalAnswer,
				{
					prompt,
					files,
				},
				true
			);

			this.agent.callbacks?.onFinalAnswer?.(finalAnswer);

			return finalAnswer;
		} else {
			this.appendScratchpad({ from: "user", content: prompt });

			const answer = await this.agent.LLMStream(this.formattedScratchpad);
			this.appendScratchpad({ from: "assistant", content: answer });

			this.agent.callbacks?.onFinalAnswer?.(answer);
			return answer;
		}
	}
}
