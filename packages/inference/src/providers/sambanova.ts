import type { ProviderMapping } from "./types";

export const SAMBANOVA_API_BASE_URL = "https://api.sambanova.ai";

type SambanovaId = string;

export const SAMBANOVA_SUPPORTED_MODEL_IDS: ProviderMapping<SambanovaId> = {
	/** Chat completion / conversational */
	conversational: {
		"Qwen/Qwen2.5-Coder-32B-Instruct": "Qwen2.5-Coder-32B-Instruct",
		"Qwen/Qwen2.5-72B-Instruct": "Qwen2.5-72B-Instruct",
		"Qwen/QwQ-32B-Preview": "QwQ-32B-Preview",
		"meta-llama/Llama-3.3-70B-Instruct": "Meta-Llama-3.3-70B-Instruct",
		"meta-llama/Llama-3.2-1B-Instruct": "Meta-Llama-3.2-1B-Instruct",
		"meta-llama/Llama-3.2-3B-Instruct": "Meta-Llama-3.2-3B-Instruct",
		"meta-llama/Llama-3.2-11B-Vision-Instruct": "Llama-3.2-11B-Vision-Instruct",
		"meta-llama/Llama-3.2-90B-Vision-Instruct": "Llama-3.2-90B-Vision-Instruct",
		"meta-llama/Llama-3.1-8B-Instruct": "Meta-Llama-3.1-8B-Instruct",
		"meta-llama/Llama-3.1-70B-Instruct": "Meta-Llama-3.1-70B-Instruct",
		"meta-llama/Llama-3.1-405B-Instruct": "Meta-Llama-3.1-405B-Instruct",
		"meta-llama/Llama-Guard-3-8B": "Meta-Llama-Guard-3-8B",
	},
};
