import { HF_HUB_INFERENCE_PROXY_TEMPLATE, type InferenceProvider } from "../inference-providers.js";
import type { PipelineType } from "../pipelines.js";
import type { ChatCompletionInputMessage, GenerationParameters } from "../tasks/index.js";
import { stringifyGenerationConfig, stringifyMessages } from "./common.js";
import { getModelInputSnippet } from "./inputs.js";
import type { InferenceSnippet, ModelDataMinimal } from "./types.js";

export const snippetBasic = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider
): InferenceSnippet[] => {
	if (provider !== "hf-inference") {
		return [];
	}
	return [
		{
			client: "curl",
			content: `\
curl https://api-inference.huggingface.co/models/${model.id} \\
	-X POST \\
	-d '{"inputs": ${getModelInputSnippet(model, true)}}' \\
	-H 'Content-Type: application/json' \\
	-H 'Authorization: Bearer ${accessToken || `{API_TOKEN}`}'`,
		},
	];
};

export const snippetTextGeneration = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	opts?: {
		streaming?: boolean;
		messages?: ChatCompletionInputMessage[];
		temperature?: GenerationParameters["temperature"];
		max_tokens?: GenerationParameters["max_tokens"];
		top_p?: GenerationParameters["top_p"];
	}
): InferenceSnippet[] => {
	if (model.tags.includes("conversational")) {
		const baseUrl =
			provider === "hf-inference"
				? `https://api-inference.huggingface.co/models/${model.id}/v1/chat/completions`
				: HF_HUB_INFERENCE_PROXY_TEMPLATE.replace("{{PROVIDER}}", provider) + "/v1/chat/completions";

		// Conversational model detected, so we display a code snippet that features the Messages API
		const streaming = opts?.streaming ?? true;
		const exampleMessages = getModelInputSnippet(model) as ChatCompletionInputMessage[];
		const messages = opts?.messages ?? exampleMessages;

		const config = {
			...(opts?.temperature ? { temperature: opts.temperature } : undefined),
			max_tokens: opts?.max_tokens ?? 500,
			...(opts?.top_p ? { top_p: opts.top_p } : undefined),
		};
		return [
			{
				client: "curl",
				content: `curl '${baseUrl}' \\
-H 'Authorization: Bearer ${accessToken || `{API_TOKEN}`}' \\
-H 'Content-Type: application/json' \\
--data '{
    "model": "${model.id}",
    "messages": ${stringifyMessages(messages, {
			indent: "\t",
			attributeKeyQuotes: true,
			customContentEscaper: (str) => str.replace(/'/g, "'\\''"),
		})},
    ${stringifyGenerationConfig(config, {
			indent: "\n    ",
			attributeKeyQuotes: true,
			attributeValueConnector: ": ",
		})},
    "stream": ${!!streaming}
}'`,
			},
		];
	} else {
		return snippetBasic(model, accessToken, provider);
	}
};

export const snippetZeroShotClassification = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider
): InferenceSnippet[] => {
	if (provider !== "hf-inference") {
		return [];
	}
	return [
		{
			client: "curl",
			content: `curl https://api-inference.huggingface.co/models/${model.id} \\
	-X POST \\
	-d '{"inputs": ${getModelInputSnippet(model, true)}, "parameters": {"candidate_labels": ["refund", "legal", "faq"]}}' \\
	-H 'Content-Type: application/json' \\
	-H 'Authorization: Bearer ${accessToken || `{API_TOKEN}`}'`,
		},
	];
};

export const snippetFile = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider
): InferenceSnippet[] => {
	if (provider !== "hf-inference") {
		return [];
	}
	return [
		{
			client: "curl",
			content: `curl https://api-inference.huggingface.co/models/${model.id} \\
	-X POST \\
	--data-binary '@${getModelInputSnippet(model, true, true)}' \\
	-H 'Authorization: Bearer ${accessToken || `{API_TOKEN}`}'`,
		},
	];
};

export const curlSnippets: Partial<
	Record<
		PipelineType,
		(
			model: ModelDataMinimal,
			accessToken: string,
			provider: InferenceProvider,
			opts?: Record<string, unknown>
		) => InferenceSnippet[]
	>
> = {
	// Same order as in tasks/src/pipelines.ts
	"text-classification": snippetBasic,
	"token-classification": snippetBasic,
	"table-question-answering": snippetBasic,
	"question-answering": snippetBasic,
	"zero-shot-classification": snippetZeroShotClassification,
	translation: snippetBasic,
	summarization: snippetBasic,
	"feature-extraction": snippetBasic,
	"text-generation": snippetTextGeneration,
	"image-text-to-text": snippetTextGeneration,
	"text2text-generation": snippetBasic,
	"fill-mask": snippetBasic,
	"sentence-similarity": snippetBasic,
	"automatic-speech-recognition": snippetFile,
	"text-to-image": snippetBasic,
	"text-to-speech": snippetBasic,
	"text-to-audio": snippetBasic,
	"audio-to-audio": snippetFile,
	"audio-classification": snippetFile,
	"image-classification": snippetFile,
	"image-to-text": snippetFile,
	"object-detection": snippetFile,
	"image-segmentation": snippetFile,
};

export function getCurlInferenceSnippet(
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	opts?: Record<string, unknown>
): InferenceSnippet[] {
	return model.pipeline_tag && model.pipeline_tag in curlSnippets
		? curlSnippets[model.pipeline_tag]?.(model, accessToken, provider, opts) ?? []
		: [];
}
