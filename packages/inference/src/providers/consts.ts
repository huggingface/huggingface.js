import type { InferenceProviderModelMapping } from "../lib/getInferenceProviderMapping";
import type { InferenceProvider } from "../types";
import { type ModelId } from "../types";

/**
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co
 * for a given Inference Provider,
 * you can add it to the following dictionary, for dev purposes.
 *
 * We also inject into this dictionary from tests.
 */
export const HARDCODED_MODEL_INFERENCE_MAPPING: Record<
	InferenceProvider,
	Record<ModelId, InferenceProviderModelMapping>
> = {
	/**
	 * "HF model ID" => "Model ID on Inference Provider's side"
	 *
	 * Example:
	 * "Qwen/Qwen2.5-Coder-32B-Instruct": "Qwen2.5-Coder-32B-Instruct",
	 */
	"black-forest-labs": {},
	cerebras: {},
	cohere: {},
	"fal-ai": {},
	"fireworks-ai": {},
	"hf-inference": {},
	hyperbolic: {},
	nebius: {},
	novita: {},
	openai: {},
	replicate: {},
	sambanova: {},
	together: {},
};
