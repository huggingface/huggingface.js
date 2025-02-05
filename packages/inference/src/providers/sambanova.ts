import type { ProviderMapping } from "./types";

export const SAMBANOVA_API_BASE_URL = "https://api.sambanova.ai";

/**
 * See the registered mapping of HF model ID => Sambanova model ID here:
 *
 * https://huggingface.co/api/partners/sambanova/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary below.
 * The dictionary is keyed by model task type (ie. "conversational" for LLMs, "text-to-image" for Flux, etc),
 * and then it's HF model ID => partner model ID.
 *
 * - If you work at Sambanova and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Sambanova, please open an issue on the present repo.
 */

export const SAMBANOVA_EXTRA_SUPPORTED_MODEL_IDS: ProviderMapping = {
	conversational: {
		// "Qwen/Qwen2.5-Coder-32B-Instruct": "Qwen2.5-Coder-32B-Instruct",
	},
};
