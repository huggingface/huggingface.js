import type { ModelId } from "../types";

export const SAMBANOVA_API_BASE_URL = "https://api.sambanova.ai";

/**
 * Note for reviewers: our goal would be to ask Sambanova to support
 * our model ids too, so we don't have to define a mapping
 * or keep it up-to-date.
 *
 * As a fallback, if the above is not possible, ask Sambanova to
 * provide the mapping as an fetchable API.
 */
type SambanovaId = string;

/**
 * https://community.sambanova.ai/t/supported-models/193
 */
export const SAMBANOVA_MODEL_IDS: Record<ModelId, SambanovaId> = {
	/** Chat completion / conversational */
	"Qwen/Qwen2.5-Coder-32B-Instruct": "Qwen2.5-Coder-32B-Instruct",
	"Qwen/Qwen2.5-72B-Instruct": "Qwen2.5-72B-Instruct",
	"Qwen/QwQ-32B-Preview": "QwQ-32B-Preview",
	"meta-llama/Llama-3.3-70B-Instruct": "Meta-Llama-3.3-70B-Instruct",
	"meta-llama/Llama-3.2-1B": "Meta-Llama-3.2-1B-Instruct",
	"meta-llama/Llama-3.2-3B": "Meta-Llama-3.2-3B-Instruct",
	"meta-llama/Llama-3.2-11B-Vision-Instruct": "Llama-3.2-11B-Vision-Instruct",
	"meta-llama/Llama-3.2-90B-Vision-Instruct": "Llama-3.2-90B-Vision-Instruct",
	"meta-llama/Llama-3.1-8B-Instruct": "Meta-Llama-3.1-8B-Instruct",
	"meta-llama/Llama-3.1-70B-Instruct": "Meta-Llama-3.1-70B-Instruct",
	"meta-llama/Llama-3.1-405B-Instruct": "Meta-Llama-3.1-405B-Instruct",
	"meta-llama/Llama-Guard-3-8B": "Meta-Llama-Guard-3-8B",
};
