import type { ProviderMapping } from "./types";

export const FAL_AI_API_BASE_URL = "https://fal.run";

type FalAiId = string;

export const FAL_AI_SUPPORTED_MODEL_IDS: ProviderMapping<FalAiId> = {
	"text-to-image": {
		"black-forest-labs/FLUX.1-schnell": "fal-ai/flux/schnell",
		"black-forest-labs/FLUX.1-dev": "fal-ai/flux/dev",
	},
	"automatic-speech-recognition": {
		"openai/whisper-large-v3": "fal-ai/whisper",
	},
	"text-to-video": {
		"genmo/mochi-1-preview": "fal-ai/mochi-v1",
		"tencent/HunyuanVideo": "fal-ai/hunyuan-video",
	},
};
