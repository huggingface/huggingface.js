import type { LLM } from "../types";
import { HfInference } from "@huggingface/inference";

export function LLMFromHub(accessToken?: string, model?: string): LLM {
	const inference = new HfInference(accessToken);

	return async (prompt: string): Promise<string> => {
		const formattedPrompt = "<|user|>" + prompt + "<|end|><|assistant|>";

		const output = await inference.textGeneration({
			inputs: formattedPrompt,
			model: model ?? "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
			parameters: {
				max_new_tokens: 900,
			},
		});

		return output.generated_text.slice(formattedPrompt.length);
	};
}

export function LLMFromEndpoint(acessToken: string, endpoint: string): LLM {
	const inference = new HfInference(acessToken).endpoint(endpoint);
	return async (prompt: string): Promise<string> => {
		const formattedPrompt = "<|user|>" + prompt + "<|end|><|assistant|>";

		const output = await inference.textGeneration({
			inputs: formattedPrompt,
			parameters: {
				max_new_tokens: 900,
			},
		});

		return output.generated_text.slice(formattedPrompt.length);
	};
}
