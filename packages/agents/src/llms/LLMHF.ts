import type { LLM } from "../types";
import { HfInference } from "@huggingface/inference";

export function LLMFromHub(accessToken?: string, model?: string): LLM {
	const inference = new HfInference(accessToken);

	return async (prompt: string): Promise<string> => {
		const output = await inference.textGeneration({
			inputs: prompt,
			model: model ?? "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
			parameters: {
				max_new_tokens: 900,
			},
		});

		return output.generated_text.slice(prompt.length);
	};
}

export function LLMFromEndpoint(accessToken: string, endpoint: string): LLM {
	const inference = new HfInference(accessToken).endpoint(endpoint);
	return async (prompt: string): Promise<string> => {
		const output = await inference.textGeneration({
			inputs: prompt,
			parameters: {
				max_new_tokens: 900,
			},
		});

		return output.generated_text.slice(prompt.length);
	};
}
