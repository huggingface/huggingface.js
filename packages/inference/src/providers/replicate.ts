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
		"OuteAI/OuteTTS-0.3-1B": "jbilcke/oute-tts:2e84120b4ff8d35c5a543fd34efe7ae2ad56909d029ccfee234f1cc8501df92c",
	},
};
