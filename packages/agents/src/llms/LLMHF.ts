import type { LLM } from "../types";
import type { TextGenerationStreamOutput } from "@huggingface/inference";
import { HfInference } from "@huggingface/inference";

export function LLMFromHub(accessToken?: string, model?: string): LLM {
	const inference = new HfInference(accessToken);

	return (prompt: string): AsyncGenerator<TextGenerationStreamOutput> => {
		const output = inference.textGenerationStream({
			inputs: prompt,
			model: model ?? "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
			parameters: {
				max_new_tokens: 900,
			},
		});

		return output;
	};
}

export function LLMFromEndpoint(accessToken: string, endpoint: string): LLM {
	const inference = new HfInference(accessToken).endpoint(endpoint);
	return (prompt: string): AsyncGenerator<TextGenerationStreamOutput> => {
		const output = inference.textGenerationStream({
			inputs: prompt,
			parameters: {
				max_new_tokens: 900,
			},
		});

		return output;
	};
}
