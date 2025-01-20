import type { ProviderMapping } from "./types";

export const REPLICATE_API_BASE_URL = "https://api.replicate.com";

type ReplicateId = string;

export const REPLICATE_SUPPORTED_MODEL_IDS: ProviderMapping<ReplicateId> = {
	"text-to-image": {
		"black-forest-labs/FLUX.1-schnell": "black-forest-labs/flux-schnell",
		"ByteDance/SDXL-Lightning":
			"bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
	},
	"text-to-speech": {
		"OuteAI/OuteTTS-0.3-500M": "jbilcke/oute-tts:39a59319327b27327fa3095149c5a746e7f2aee18c75055c3368237a6503cd26",
	},
};
