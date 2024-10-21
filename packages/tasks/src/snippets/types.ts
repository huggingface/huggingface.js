import type { ModelData } from "../model-data";
import type { ChatCompletionInputMessage, GenerationParameters } from "../tasks";

/**
 * Minimal model data required for snippets.
 *
 * Add more fields as needed.
 */
export type ModelDataMinimal = Pick<
	ModelData,
	"id" | "pipeline_tag" | "mask_token" | "library_name" | "config" | "tags" | "inference"
>;

export interface InferenceSnippet {
	content: string;
	client?: string; // for instance: `client` could be `huggingface_hub` or `openai` client for Python snippets
}

interface GenerationSnippetDelimiter {
	sep: string;
	start: string;
	end: string;
	connector?: string;
}

type PartialGenerationParameters = Partial<Pick<GenerationParameters, "temperature" | "max_tokens" | "top_p">>;

export type GenerationMessagesFormatter = ({
	messages,
	sep,
	start,
	end,
}: GenerationSnippetDelimiter & { messages: ChatCompletionInputMessage[] }) => string;

export type GenerationConfigFormatter = ({
	config,
	sep,
	start,
	end,
	connector,
}: GenerationSnippetDelimiter & { config: PartialGenerationParameters }) => string;
