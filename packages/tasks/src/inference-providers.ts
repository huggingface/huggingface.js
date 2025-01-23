export const INFERENCE_PROVIDERS = ["hf-inference", "fal-ai", "replicate", "sambanova", "together"] as const;

export type InferenceProvider = (typeof INFERENCE_PROVIDERS)[number];

export const HF_HUB_INFERENCE_PROXY_TEMPLATE = `https://huggingface.co/api/inference-proxy/{{PROVIDER}}`;
