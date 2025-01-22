export const INFERENCE_PROVIDERS = ["hf-inference", "fal-ai", "replicate", "sambanova", "together"] as const;

export type InferenceProvider = (typeof INFERENCE_PROVIDERS)[number];
