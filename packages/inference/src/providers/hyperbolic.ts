import type { ProviderMapping } from "./types";

export const HYPERBOLIC_API_BASE_URL = "https://api.hyperbolic.xyz";

type HyperbolicId = string;

/**
 * https://docs.together.ai/reference/models-1
 */
export const HYPERBOLIC_SUPPORTED_MODEL_IDS: ProviderMapping<HyperbolicId> = {
	"text-to-image": {
		"black-forest-labs/FLUX.1-dev": "black-forest-labs/FLUX.1-dev",
		"stabilityai/stable-diffusion-xl-base-1.0": "SDXL1.0-base",
		"stable-diffusion-v1-5/stable-diffusion-v1-5": "stable-diffusion-v1-5/stable-diffusion-v1-5",
		"segmind/SSD-1B": "segmind/SSD-1B",
		"stabilityai/stable-diffusion-2": "stabilityai/stable-diffusion-2",
		"stabilityai/sdxl-turbo": "stabilityai/sdxl-turbo",
	},
	"image-text-to-text": {
		"Qwen/Qwen2-VL-72B-Instruct": "Qwen/Qwen2-VL-72B-Instruct",
		"mistralai/Pixtral-12B-2409": "mistralai/Pixtral-12B-2409",
		"Qwen/Qwen2-VL-7B-Instruct": "Qwen/Qwen2-VL-7B-Instruct",
	},
	"text-generation": {
		"meta-llama/Llama-3.1-405B-BASE-BF16": "meta-llama/Llama-3.1-405B-BASE-BF16",
		"meta-llama/Llama-3.1-405B-BASE-FP8": "meta-llama/Llama-3.1-405B-BASE-FP8",
		"Qwen/Qwen2.5-72B-Instruct": "Qwen/Qwen2.5-72B-Instruct-BF16",
	},
	"text-to-audio": {
		"myshell-ai/MeloTTS-English-v3": "myshell-ai/MeloTTS-English-v3",
	},
	conversational: {
		"deepseek-ai/DeepSeek-R1": "deepseek-ai/DeepSeek-R1",
		"deepseek-ai/DeepSeek-R1-Zero": "deepseek-ai/DeepSeek-R1-Zero",
		"deepseek-ai/DeepSeek-V3": "deepseek-ai/DeepSeek-V3",
		"meta-llama/Llama-3.2-3B-Instruct": "meta-llama/Llama-3.2-3B-Instruct",
		"meta-llama/Llama-3.3-70B-Instruct": "meta-llama/Llama-3.3-70B-Instruct",
		"meta-llama/Llama-3.1-70B-Instruct": "meta-llama/Llama-3.1-70B-Instruct-BF16",
		"meta-llama/Meta-Llama-3-70B-Instruct": "meta-llama/Llama-3-70b-BF16",
		"meta-llama/Llama-3.1-8B-Instruct": "meta-llama/Llama-3.1-8B-Instruct-BF16",
		"NousResearch/Hermes-3-Llama-3.1-70B": "NousResearch/Hermes-3-Llama-3.1-70B-BF16",
		"Qwen/Qwen2.5-72B-Instruct": "Qwen/Qwen2.5-72B-Instruct-BF16",
		"Qwen/Qwen2.5-Coder-32B-Instruct": "Qwen/Qwen2.5-Coder-32B-Instruct-BF16",
		"Qwen/QwQ-32B-Preview": "Qwen/QwQ-32B-Preview-BF16",
	},
};
