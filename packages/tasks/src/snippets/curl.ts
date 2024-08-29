import type { PipelineType } from "../pipelines.js";
import { getModelInputSnippet } from "./inputs.js";
import type { ModelDataMinimal } from "./types.js";

export const snippetBasic = (model: ModelDataMinimal, accessToken: string): string =>
	`curl https://api-inference.huggingface.co/models/${model.id} \\
	-X POST \\
	-d '{"inputs": ${getModelInputSnippet(model, true)}}' \\
	-H 'Content-Type: application/json' \\
	-H "Authorization: Bearer ${accessToken || `{API_TOKEN}`}"`;

export const snippetTextGeneration = (model: ModelDataMinimal, accessToken: string): string => {
	if (model.config?.tokenizer_config?.chat_template) {
		// Conversational model detected, so we display a code snippet that features the Messages API
		return `curl 'https://api-inference.huggingface.co/models/${model.id}/v1/chat/completions' \\
-H "Authorization: Bearer ${accessToken || `{API_TOKEN}`}" \\
-H 'Content-Type: application/json' \\
-d '{
	"model": "${model.id}",
	"messages": [{"role": "user", "content": "What is the capital of France?"}],
	"max_tokens": 500,
	"stream": false
}'
`;
	} else {
		return snippetBasic(model, accessToken);
	}
};

export const snippetZeroShotClassification = (model: ModelDataMinimal, accessToken: string): string =>
	`curl https://api-inference.huggingface.co/models/${model.id} \\
	-X POST \\
	-d '{"inputs": ${getModelInputSnippet(model, true)}, "parameters": {"candidate_labels": ["refund", "legal", "faq"]}}' \\
	-H 'Content-Type: application/json' \\
	-H "Authorization: Bearer ${accessToken || `{API_TOKEN}`}"`;

export const snippetFile = (model: ModelDataMinimal, accessToken: string): string =>
	`curl https://api-inference.huggingface.co/models/${model.id} \\
	-X POST \\
	--data-binary '@${getModelInputSnippet(model, true, true)}' \\
	-H "Authorization: Bearer ${accessToken || `{API_TOKEN}`}"`;

export const curlSnippets: Partial<Record<PipelineType, (model: ModelDataMinimal, accessToken: string) => string>> = {
	// Same order as in js/src/lib/interfaces/Types.ts
	"text-classification": snippetBasic,
	"token-classification": snippetBasic,
	"table-question-answering": snippetBasic,
	"question-answering": snippetBasic,
	"zero-shot-classification": snippetZeroShotClassification,
	translation: snippetBasic,
	summarization: snippetBasic,
	"feature-extraction": snippetBasic,
	"text-generation": snippetTextGeneration,
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

export function getCurlInferenceSnippet(model: ModelDataMinimal, accessToken: string): string {
	return model.pipeline_tag && model.pipeline_tag in curlSnippets
		? curlSnippets[model.pipeline_tag]?.(model, accessToken) ?? ""
		: "";
}

export function hasCurlInferenceSnippet(model: Pick<ModelDataMinimal, "pipeline_tag">): boolean {
	return !!model.pipeline_tag && model.pipeline_tag in curlSnippets;
}
