import type { ModelId } from "../types";

export const TOGETHER_API_BASE_URL = "https://api.together.xyz";

/**
 * Same comment as in sambanova.ts
 */
type TogetherId = string;

/**
 * https://docs.together.ai/reference/models-1
 */
export const TOGETHER_MODEL_IDS: Record<
	ModelId,
	{ id: TogetherId; type: "chat" | "embedding" | "image" | "language" | "moderation" }
> = {
	/** text-to-image */
	"black-forest-labs/FLUX.1-Canny-dev": { id: "black-forest-labs/FLUX.1-canny", type: "image" },
	"black-forest-labs/FLUX.1-Depth-dev": { id: "black-forest-labs/FLUX.1-depth", type: "image" },
	"black-forest-labs/FLUX.1-dev": { id: "black-forest-labs/FLUX.1-dev", type: "image" },
	"black-forest-labs/FLUX.1-Redux-dev": { id: "black-forest-labs/FLUX.1-redux", type: "image" },
	"black-forest-labs/FLUX.1-schnell": { id: "black-forest-labs/FLUX.1-pro", type: "image" },
	"stabilityai/stable-diffusion-xl-base-1.0": { id: "stabilityai/stable-diffusion-xl-base-1.0", type: "image" },

	/** chat completion */
	"databricks/dbrx-instruct": { id: "databricks/dbrx-instruct", type: "chat" },
	"deepseek-ai/deepseek-llm-67b-chat": { id: "deepseek-ai/deepseek-llm-67b-chat", type: "chat" },
	"google/gemma-2-9b-it": { id: "google/gemma-2-9b-it", type: "chat" },
	"google/gemma-2b-it": { id: "google/gemma-2-27b-it", type: "chat" },
	"llava-hf/llava-v1.6-mistral-7b-hf": { id: "llava-hf/llava-v1.6-mistral-7b-hf", type: "chat" },
	"meta-llama/Llama-2-13b-chat-hf": { id: "meta-llama/Llama-2-13b-chat-hf", type: "chat" },
	"meta-llama/Llama-2-70b-hf": { id: "meta-llama/Llama-2-70b-hf", type: "language" },
	"meta-llama/Llama-2-7b-chat-hf": { id: "meta-llama/Llama-2-7b-chat-hf", type: "chat" },
	"meta-llama/Llama-3.2-11B-Vision-Instruct": { id: "meta-llama/Llama-Vision-Free", type: "chat" },
	"meta-llama/Llama-3.2-3B-Instruct": { id: "meta-llama/Llama-3.2-3B-Instruct-Turbo", type: "chat" },
	"meta-llama/Llama-3.2-90B-Vision-Instruct": { id: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo", type: "chat" },
	"meta-llama/Llama-3.3-70B-Instruct": { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", type: "chat" },
	"meta-llama/Meta-Llama-3-70B-Instruct": { id: "meta-llama/Llama-3-70b-chat-hf", type: "chat" },
	"meta-llama/Meta-Llama-3-8B-Instruct": { id: "togethercomputer/Llama-3-8b-chat-hf-int4", type: "chat" },
	"meta-llama/Meta-Llama-3.1-405B-Instruct": { id: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo", type: "chat" },
	"meta-llama/Meta-Llama-3.1-70B-Instruct": { id: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", type: "chat" },
	"meta-llama/Meta-Llama-3.1-8B-Instruct": { id: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo-128K", type: "chat" },
	"microsoft/WizardLM-2-8x22B": { id: "microsoft/WizardLM-2-8x22B", type: "chat" },
	"mistralai/Mistral-7B-Instruct-v0.3": { id: "mistralai/Mistral-7B-Instruct-v0.3", type: "chat" },
	"mistralai/Mixtral-8x22B-Instruct-v0.1": { id: "mistralai/Mixtral-8x22B-Instruct-v0.1", type: "chat" },
	"mistralai/Mixtral-8x7B-Instruct-v0.1": { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", type: "chat" },
	"NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO": { id: "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO", type: "chat" },
	"nvidia/Llama-3.1-Nemotron-70B-Instruct-HF": { id: "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF", type: "chat" },
	"Qwen/Qwen2-72B-Instruct": { id: "Qwen/Qwen2-72B-Instruct", type: "chat" },
	"Qwen/Qwen2.5-72B-Instruct": { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", type: "chat" },
	"Qwen/Qwen2.5-7B-Instruct": { id: "Qwen/Qwen2.5-7B-Instruct-Turbo", type: "chat" },
	"Qwen/Qwen2.5-Coder-32B-Instruct": { id: "Qwen/Qwen2.5-Coder-32B-Instruct", type: "chat" },
	"Qwen/QwQ-32B-Preview": { id: "Qwen/QwQ-32B-Preview", type: "chat" },
	"scb10x/llama-3-typhoon-v1.5-8b-instruct": { id: "scb10x/scb10x-llama3-typhoon-v1-5-8b-instruct", type: "chat" },
	"scb10x/llama-3-typhoon-v1.5x-70b-instruct-awq": { id: "scb10x/scb10x-llama3-typhoon-v1-5x-4f316", type: "chat" },

	/** text-generation */
	"meta-llama/Meta-Llama-3-8B": { id: "meta-llama/Meta-Llama-3-8B", type: "language" },
	"mistralai/Mixtral-8x7B-v0.1": { id: "mistralai/Mixtral-8x7B-v0.1", type: "language" },
};
