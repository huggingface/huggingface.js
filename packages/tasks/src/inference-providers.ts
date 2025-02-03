export const INFERENCE_PROVIDERS = ["hf-inference", "fal-ai", "replicate", "sambanova", "together"] as const;

export type InferenceProvider = (typeof INFERENCE_PROVIDERS)[number];

export const HF_HUB_INFERENCE_PROXY_TEMPLATE = `https://huggingface.co/api/inference-proxy/{{PROVIDER}}`;

/**
 * URL to set as baseUrl in the OpenAI SDK.
 *
 * TODO(Expose this from HfInference in the future?)
 */
export function openAIbaseUrl(provider: InferenceProvider): string {
	return provider === "hf-inference"
		? "https://api-inference.huggingface.co/v1/"
		: HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", provider);
}
