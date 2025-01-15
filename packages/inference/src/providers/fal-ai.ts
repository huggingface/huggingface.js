import type { ModelId } from "../types";

export const FAL_AI_API_BASE_URL = "https://fal.run";

type FalAiId = string;

/**
 * Mapping from HF model ID -> fal.ai app id
 */
export const FAL_AI_MODEL_IDS: Partial<Record<ModelId, FalAiId>> = {
	/** text-to-image */
	"black-forest-labs/FLUX.1-schnell": "fal-ai/flux/schnell",
	"black-forest-labs/FLUX.1-dev": "fal-ai/flux/dev",

	/** automatic-speech-recognition */
	"openai/whisper-large-v3": "fal-ai/whisper",
};
