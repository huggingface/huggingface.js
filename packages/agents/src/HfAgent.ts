import { evalBuilder } from './lib/evalBuilder.js';
import { generateCode } from './lib/generateCode.js';
import { defaultTools } from './tools.js';
import type { LLM, Tool, Update } from './types.js';
import { LLMFromHub } from './llms/LLMHF.js';
import { generatePrompt } from './lib/promptGeneration.js';
import { messageTool } from './tools/message.js';

export class HfAgent {
	private accessToken: string;
	private llm: LLM;
	private tools: Tool[];

	constructor(accessToken = "", LLM?: LLM, tools?: Tool[]) {
		this.accessToken = accessToken;
		this.llm = LLM ?? LLMFromHub(accessToken);
		this.tools = tools ?? defaultTools;
	}

	public generatePrompt(prompt: string, files?: FileList): string {
		return generatePrompt(prompt, [...this.tools, messageTool], {
			image: !!files && files[0].type.startsWith("image"),
			audio: !!files && files[0].type.startsWith("audio"),
		});
	}

	public async generateCode(prompt: string, files?: FileList): Promise<string> {
		return await generateCode(prompt, this.tools, files, this.llm.bind(this));
	}

	public async evaluateCode(code: string, files?: FileList): Promise<Update[]> {
		const updates: Update[] = [];

		const callback = (message: string, data: undefined | string | Blob) => {
			updates.push({ message, data });
		};

		const wrapperEval = await evalBuilder(code, this.tools, files, callback, this.accessToken);

		try {
			await wrapperEval();
		} catch (e) {
			if (e instanceof Error) {
				updates.push({ message: "An error occurred", data: e.message });
			}
		}

		return updates;
	}

	public async run(prompt: string, files?: FileList): Promise<Update[]> {
		const code = await this.generateCode(prompt, files);
		const updates = await this.evaluateCode(code, files);
		return updates;
	}
}
