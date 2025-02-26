/// This list is for illustration purposes only.
/// in the `tasks` sub-package, we do not need actual strong typing of the inference providers.
const INFERENCE_PROVIDERS = [
	"fal-ai",
	"fireworks-ai",
	"hf-inference",
	"hyperbolic",
	"replicate",
	"sambanova",
	"together",
] as const;

export type SnippetInferenceProvider = (typeof INFERENCE_PROVIDERS)[number] | string;

export const HF_HUB_INFERENCE_PROXY_TEMPLATE = `https://router.huggingface.co/{{PROVIDER}}`;

/**
 * URL to set as baseUrl in the OpenAI SDK.
 *
 * TODO(Expose this from HfInference in the future?)
 */
export function openAIbaseUrl(provider: SnippetInferenceProvider): string {
	const url = HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", provider);
	return provider === "hf-inference" ? `${url}/v1` : url;
}
