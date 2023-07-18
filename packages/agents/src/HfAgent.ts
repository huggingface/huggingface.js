import { HfInference } from "../../inference/src";
import type { TextGenerationOutput } from "../../inference/src";

import { evalBuilder } from "./lib/evalBuilder";
import { generateCode } from "./lib/generateCode";
import { defaultTools } from "./tools";
import type { Tool, Update } from "./types/public";

export interface LLMFromHub {
	model: string;
}
export interface LLMFromEndpoint {
	endpoint: string;
}
export type LLMSettings = LLMFromEndpoint | LLMFromHub;

function isLLMFromHub(settings: LLMSettings): settings is LLMFromHub {
	return (settings as LLMFromHub).model !== undefined;
}

export class HfAgent {
	private accessToken: string;
	private settings: LLMSettings;
	private tools: Tool[];

	constructor(accessToken = "", settings?: LLMSettings, tools?: Tool[]) {
		this.accessToken = accessToken;
		this.settings = settings ?? { model: "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5" };
		this.tools = tools ?? defaultTools;
	}

	public async LLM(prompt: string): Promise<string> {
		const formattedPrompt = "<|user|>" + prompt + "<|end|><|assistant|>";

		let output: TextGenerationOutput;
		if (isLLMFromHub(this.settings)) {
			output = await new HfInference(this.accessToken).textGeneration({
				inputs: formattedPrompt,
				model: this.settings.model,
				parameters: {
					max_new_tokens: 512,
				},
			});
		} else {
			output = await new HfInference(this.accessToken).endpoint(this.settings.endpoint).textGeneration({
				inputs: formattedPrompt,
				parameters: {
					max_new_tokens: 512,
				},
			});
		}

		const text = output.generated_text.slice(formattedPrompt.length);

		return text;
	}

	public async generateCode(prompt: string, files?: FileList): Promise<string> {
		return await generateCode(prompt, this.tools, files, this.LLM.bind(this));
	}

	public async evaluateCode(code: string, files?: FileList): Promise<Update[]> {
		const updates: Update[] = [];

		const callback = (message: string, data: undefined | string | Blob) => {
			updates.push({ message, data });
		};

		const wrapperEval = await evalBuilder(code, this.tools, files, callback);

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
		console.log(code);
		const updates = await this.evaluateCode(code, files);
		console.log(updates);
		return updates;
	}
}
