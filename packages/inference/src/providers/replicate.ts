import type { ModelId } from "../types";

export const REPLICATE_API_BASE_URL = "https://api.replicate.com";

/**
 * Same comment as in sambanova.ts
 */
type ReplicateId = string;

/**
 * curl -s \
 * -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
 * https://api.replicate.com/v1/models
 */
export const REPLICATE_MODEL_IDS: Record<ModelId, ReplicateId> = {
	"black-forest-labs/FLUX.1-schnell": "black-forest-labs/flux-schnell",
	"ByteDance/SDXL-Lightning": "bytedance/sdxl-lightning-4step",
};
