import type { ProviderMapping } from "./types";

export const TOGETHER_API_BASE_URL = "https://api.together.xyz";

/**
 * Same comment as in sambanova.ts
 */
type TogetherId = string;

/**
 * https://docs.together.ai/reference/models-1
 */
export const TOGETHER_SUPPORTED_MODEL_IDS: ProviderMapping<TogetherId> = {
	"text-to-image": {
		"black-forest-labs/FLUX.1-Canny-dev": "black-forest-labs/FLUX.1-canny",
		"black-forest-labs/FLUX.1-Depth-dev": "black-forest-labs/FLUX.1-depth",
		"black-forest-labs/FLUX.1-dev": "black-forest-labs/FLUX.1-dev",
		"black-forest-labs/FLUX.1-Redux-dev": "black-forest-labs/FLUX.1-redux",
		"black-forest-labs/FLUX.1-schnell": "black-forest-labs/FLUX.1-pro",
		"stabilityai/stable-diffusion-xl-base-1.0": "stabilityai/stable-diffusion-xl-base-1.0",
	},
	conversational: {
		"databricks/dbrx-instruct": "databricks/dbrx-instruct",
		"deepseek-ai/DeepSeek-R1": "deepseek-ai/DeepSeek-R1",
		"deepseek-ai/DeepSeek-V3": "deepseek-ai/DeepSeek-V3",
		"deepseek-ai/deepseek-llm-67b-chat": "deepseek-ai/deepseek-llm-67b-chat",
		"google/gemma-2-9b-it": "google/gemma-2-9b-it",
		"google/gemma-2b-it": "google/gemma-2-27b-it",
		"meta-llama/Llama-2-13b-chat-hf": "meta-llama/Llama-2-13b-chat-hf",
		"meta-llama/Llama-2-7b-chat-hf": "meta-llama/Llama-2-7b-chat-hf",
		"meta-llama/Llama-3.2-11B-Vision-Instruct": "meta-llama/Llama-Vision-Free",
		"meta-llama/Llama-3.2-3B-Instruct": "meta-llama/Llama-3.2-3B-Instruct-Turbo",
		"meta-llama/Llama-3.2-90B-Vision-Instruct": "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
		"meta-llama/Llama-3.3-70B-Instruct": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
		"meta-llama/Meta-Llama-3-70B-Instruct": "meta-llama/Llama-3-70b-chat-hf",
		"meta-llama/Meta-Llama-3-8B-Instruct": "meta-llama/Meta-Llama-3-8B-Instruct-Turbo",
		"meta-llama/Meta-Llama-3.1-405B-Instruct": "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
		"meta-llama/Meta-Llama-3.1-70B-Instruct": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
		"meta-llama/Meta-Llama-3.1-8B-Instruct": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo-128K",
		"microsoft/WizardLM-2-8x22B": "microsoft/WizardLM-2-8x22B",
		"mistralai/Mistral-7B-Instruct-v0.3": "mistralai/Mistral-7B-Instruct-v0.3",
		"mistralai/Mistral-Small-24B-Instruct-2501": "mistralai/Mistral-Small-24B-Instruct-2501",
		"mistralai/Mixtral-8x22B-Instruct-v0.1": "mistralai/Mixtral-8x22B-Instruct-v0.1",
		"mistralai/Mixtral-8x7B-Instruct-v0.1": "mistralai/Mixtral-8x7B-Instruct-v0.1",
		"NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO": "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO",
		"nvidia/Llama-3.1-Nemotron-70B-Instruct-HF": "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
		"Qwen/Qwen2-72B-Instruct": "Qwen/Qwen2-72B-Instruct",
		"Qwen/Qwen2.5-72B-Instruct": "Qwen/Qwen2.5-72B-Instruct-Turbo",
		"Qwen/Qwen2.5-7B-Instruct": "Qwen/Qwen2.5-7B-Instruct-Turbo",
		"Qwen/Qwen2.5-Coder-32B-Instruct": "Qwen/Qwen2.5-Coder-32B-Instruct",
		"Qwen/QwQ-32B-Preview": "Qwen/QwQ-32B-Preview",
		"scb10x/llama-3-typhoon-v1.5-8b-instruct": "scb10x/scb10x-llama3-typhoon-v1-5-8b-instruct",
		"scb10x/llama-3-typhoon-v1.5x-70b-instruct-awq": "scb10x/scb10x-llama3-typhoon-v1-5x-4f316",
	},
	"text-generation": {
		"meta-llama/Llama-2-70b-hf": "meta-llama/Llama-2-70b-hf",
		"mistralai/Mixtral-8x7B-v0.1": "mistralai/Mixtral-8x7B-v0.1",
	},
};
