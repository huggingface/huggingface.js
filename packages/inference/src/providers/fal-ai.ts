import type { ModelId } from "../types";

export const FAL_AI_API_BASE_URL = "https://fal.run";

type FalAiId = string;

export const FAL_AI_MODEL_IDS: Record<ModelId, FalAiId> = {
	"black-forest-labs/FLUX.1-schnell": "fal-ai/flux/schnell",
	"black-forest-labs/FLUX.1-dev": "fal-ai/flux/dev",
	"black-forest-labs/FLUX.1-Redux-dev": "fal-ai/flux/dev/redux",
	"openai/whisper-large-v3": "fal-ai/wizper",
	"TencentARC/PhotoMaker": "fal-ai/photomaker",
};
