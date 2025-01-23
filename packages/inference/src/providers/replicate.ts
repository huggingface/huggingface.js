import type { ProviderMapping } from "./types";

export const REPLICATE_API_BASE_URL = "https://api.replicate.com";

type ReplicateId = string;

export const REPLICATE_SUPPORTED_MODEL_IDS: ProviderMapping<ReplicateId> = {
	"text-to-image": {
		"black-forest-labs/FLUX.1-dev": "black-forest-labs/flux-dev",
		"black-forest-labs/FLUX.1-schnell": "black-forest-labs/flux-schnell",
		"ByteDance/Hyper-SD":
			"bytedance/hyper-flux-16step:382cf8959fb0f0d665b26e7e80b8d6dc3faaef1510f14ce017e8c732bb3d1eb7",
		"ByteDance/SDXL-Lightning":
			"bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
		"playgroundai/playground-v2.5-1024px-aesthetic":
			"playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24",
		"stabilityai/stable-diffusion-3.5-large-turbo": "stability-ai/stable-diffusion-3.5-large-turbo",
		"stabilityai/stable-diffusion-3.5-large": "stability-ai/stable-diffusion-3.5-large",
		"stabilityai/stable-diffusion-3.5-medium": "stability-ai/stable-diffusion-3.5-medium",
		"stabilityai/stable-diffusion-xl-base-1.0":
			"stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
	},
	"text-to-speech": {
		"OuteAI/OuteTTS-0.3-500M": "jbilcke/oute-tts:39a59319327b27327fa3095149c5a746e7f2aee18c75055c3368237a6503cd26",
	},
	"text-to-video": {
		"genmo/mochi-1-preview": "genmoai/mochi-1:1944af04d098ef69bed7f9d335d102e652203f268ec4aaa2d836f6217217e460",
	},
};
