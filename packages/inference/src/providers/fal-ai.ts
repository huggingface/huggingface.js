import type { ProviderMapping } from "./types";

export const FAL_AI_API_BASE_URL = "https://fal.run";

type FalAiId = string;

export const FAL_AI_SUPPORTED_MODEL_IDS: ProviderMapping<FalAiId> = {
	"text-to-image": {
		"black-forest-labs/FLUX.1-schnell": "fal-ai/flux/schnell",
		"black-forest-labs/FLUX.1-dev": "fal-ai/flux/dev",
		"playgroundai/playground-v2.5-1024px-aesthetic": "fal-ai/playground-v25",
		"ByteDance/SDXL-Lightning": "fal-ai/lightning-models",
		"PixArt-alpha/PixArt-Sigma-XL-2-1024-MS": "fal-ai/pixart-sigma",
		"stabilityai/stable-diffusion-3-medium": "fal-ai/stable-diffusion-v3-medium",
		"Warlord-K/Sana-1024": "fal-ai/sana",
		"fal/AuraFlow-v0.2": "fal-ai/aura-flow",
		"stabilityai/stable-diffusion-3.5-large": "fal-ai/stable-diffusion-v35-large",
		"stabilityai/stable-diffusion-3.5-large-turbo": "fal-ai/stable-diffusion-v35-large/turbo",
		"stabilityai/stable-diffusion-3.5-medium": "fal-ai/stable-diffusion-v35-medium",
		"Kwai-Kolors/Kolors": "fal-ai/kolors",
	},
	"automatic-speech-recognition": {
		"openai/whisper-large-v3": "fal-ai/whisper",
	},
	"text-to-video": {
		"genmo/mochi-1-preview": "fal-ai/mochi-v1",
		"tencent/HunyuanVideo": "fal-ai/hunyuan-video",
		"THUDM/CogVideoX-5b": "fal-ai/cogvideox-5b",
		"Lightricks/LTX-Video": "fal-ai/ltx-video",
	},
};
