import type { ModelId } from "../types";

export const REPLICATE_API_BASE_URL = "https://api.replicate.com";

type ReplicateId = string;

/**
 * Mapping from HF model ID -> Replicate model ID
 *
 * Available models can be fetched with:
 * ```
 * curl -s \
 * 	-H "Authorization: Bearer $REPLICATE_API_TOKEN" \
 * 	'https://api.replicate.com/v1/models'
 * ```
 */
export const REPLICATE_MODEL_IDS: Record<ModelId, ReplicateId> = {
	/** text-to-image */
	"black-forest-labs/FLUX.1-schnell": "black-forest-labs/flux-schnell",
	"ByteDance/SDXL-Lightning": "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
};
