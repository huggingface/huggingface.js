import type { PipelineType, WidgetType } from "@huggingface/tasks/src/pipelines.js";
import type { ChatCompletionInputMessage, GenerationParameters } from "@huggingface/tasks/src/tasks/index.js";
import {
	openAIbaseUrl,
	type InferenceSnippet,
	type ModelDataMinimal,
	getModelInputSnippet,
	stringifyGenerationConfig,
	stringifyMessages,
} from "@huggingface/tasks";
import type { InferenceProvider } from "../types";
import fs from "fs";
import Handlebars from "handlebars";
import path from "path";
import { existsSync as pathExists } from "node:fs";

const TOOLS = ["huggingface_hub", "requests", "fal_client", "openai"];

type InputPreparationFn = (model: ModelDataMinimal, opts?: Record<string, unknown>) => string | object;
interface TemplateParams {
	accessToken?: string;
	baseUrl?: string;
	inputs?: string | object;
	model?: ModelDataMinimal;
	provider?: InferenceProvider;
	providerModelId?: string;
	methodName?: string; // specific to snippetBasic
	importBase64?: boolean; // specific to snippetImportRequests
}

Handlebars.registerHelper("equals", function (value1, value2) {
	return value1 === value2;
});

// Helpers to find + load templates

const rootDirFinder = (): string => {
	let currentPath = path.normalize(import.meta.url).replace("file:", "");

	while (currentPath !== "/") {
		if (pathExists(path.join(currentPath, "package.json"))) {
			return currentPath;
		}

		currentPath = path.normalize(path.join(currentPath, ".."));
	}

	return "/";
};

const templatePath = (tool: string, templateName: string): string =>
	path.join(rootDirFinder(), "src", "snippets", "templates", "python", tool, `${templateName}.hbs`);
const hasTemplate = (tool: string, templateName: string): boolean => pathExists(templatePath(tool, templateName));

const loadTemplate = (tool: string, templateName: string): ((data: TemplateParams) => string) => {
	const template = fs.readFileSync(templatePath(tool, templateName), "utf8");
	return Handlebars.compile<TemplateParams>(template);
};

const snippetImportInferenceClient = loadTemplate("huggingface_hub", "importInferenceClient");
const snippetImportRequests = loadTemplate("requests", "importRequests");

// Needed for huggingface_hub basic snippets

const HFH_INFERENCE_CLIENT_METHODS: Partial<Record<WidgetType, string>> = {
	"audio-classification": "audio_classification",
	"audio-to-audio": "audio_to_audio",
	"automatic-speech-recognition": "automatic_speech_recognition",
	"text-to-speech": "text_to_speech",
	"image-classification": "image_classification",
	"image-segmentation": "image_segmentation",
	"image-to-image": "image_to_image",
	"image-to-text": "image_to_text",
	"object-detection": "object_detection",
	"text-to-image": "text_to_image",
	"text-to-video": "text_to_video",
	"zero-shot-image-classification": "zero_shot_image_classification",
	"document-question-answering": "document_question_answering",
	"visual-question-answering": "visual_question_answering",
	"feature-extraction": "feature_extraction",
	"fill-mask": "fill_mask",
	"question-answering": "question_answering",
	"sentence-similarity": "sentence_similarity",
	summarization: "summarization",
	"table-question-answering": "table_question_answering",
	"text-classification": "text_classification",
	"text-generation": "text_generation",
	"token-classification": "token_classification",
	translation: "translation",
	"zero-shot-classification": "zero_shot_classification",
	"tabular-classification": "tabular_classification",
	"tabular-regression": "tabular_regression",
};

// Snippet generators
const snippetGenerator = (templateName: string, inputPreparationFn?: InputPreparationFn) => {
	return (
		model: ModelDataMinimal,
		accessToken: string,
		provider: InferenceProvider,
		providerModelId?: string,
		opts?: Record<string, unknown>
	): InferenceSnippet[] => {
		const params: TemplateParams = {
			accessToken,
			baseUrl: templateName.includes("conversational") ? openAIbaseUrl(provider) : undefined,
			inputs: inputPreparationFn ? inputPreparationFn(model, opts) : getModelInputSnippet(model),
			model,
			provider,
			providerModelId: providerModelId ?? model.id,
		};

		// Iterate over tools => check if a snippet exists => generate
		return TOOLS.map((tool) => {
			if (!hasTemplate(tool, templateName)) {
				return;
			}
			const template = loadTemplate(tool, templateName);
			if (tool === "huggingface_hub" && templateName === "basic") {
				if (!(model.pipeline_tag && model.pipeline_tag in HFH_INFERENCE_CLIENT_METHODS)) {
					return;
				}
				params["methodName"] = HFH_INFERENCE_CLIENT_METHODS[model.pipeline_tag];
			}
			return {
				client: tool,
				content: template(params).trim(),
			};
		}).filter((snippet) => snippet !== undefined && snippet.content) as InferenceSnippet[];
	};
};

// Input preparation functions (required for a few tasks)
const prepareConversationalInput = (
	model: ModelDataMinimal,
	opts?: {
		streaming?: boolean;
		messages?: ChatCompletionInputMessage[];
		temperature?: GenerationParameters["temperature"];
		max_tokens?: GenerationParameters["max_tokens"];
		top_p?: GenerationParameters["top_p"];
	}
): object => {
	const exampleMessages = getModelInputSnippet(model) as ChatCompletionInputMessage[];
	const messages = opts?.messages ?? exampleMessages;
	const config = {
		...(opts?.temperature ? { temperature: opts?.temperature } : undefined),
		max_tokens: opts?.max_tokens ?? 500,
		...(opts?.top_p ? { top_p: opts?.top_p } : undefined),
	};

	return {
		messagesStr: stringifyMessages(messages, { attributeKeyQuotes: true }),
		configStr: stringifyGenerationConfig(config, {
			indent: "\n\t",
			attributeValueConnector: "=",
		}),
	};
};

const prepareDocumentQuestionAnsweringInput = (model: ModelDataMinimal): object => {
	const inputsAsStr = getModelInputSnippet(model) as string;
	const inputsAsObj = JSON.parse(inputsAsStr);
	return { asObj: inputsAsObj, asStr: inputsAsStr };
};

const prepareImageToImageInput = (model: ModelDataMinimal): object => {
	return JSON.parse(getModelInputSnippet(model) as string);
};

const snippetConversational = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string,
	opts?: {
		streaming?: boolean;
		messages?: ChatCompletionInputMessage[];
		temperature?: GenerationParameters["temperature"];
		max_tokens?: GenerationParameters["max_tokens"];
		top_p?: GenerationParameters["top_p"];
	}
): InferenceSnippet[] => {
	const streaming = opts?.streaming ?? true;
	const templateName = streaming ? "conversationalStream" : "conversational";
	return snippetGenerator(templateName, prepareConversationalInput)(model, accessToken, provider, providerModelId, {
		...opts,
		streaming,
	});
};

const pythonSnippets: Partial<
	Record<
		PipelineType,
		(
			model: ModelDataMinimal,
			accessToken: string,
			provider: InferenceProvider,
			providerModelId?: string,
			opts?: Record<string, unknown>
		) => InferenceSnippet[]
	>
> = {
	"audio-classification": snippetGenerator("basicFile"),
	"audio-to-audio": snippetGenerator("basicFile"),
	"automatic-speech-recognition": snippetGenerator("automaticSpeechRecognition"),
	"document-question-answering": snippetGenerator("documentQuestionAnswering", prepareDocumentQuestionAnsweringInput),
	"feature-extraction": snippetGenerator("basic"),
	"fill-mask": snippetGenerator("basic"),
	"image-classification": snippetGenerator("basicFile"),
	"image-segmentation": snippetGenerator("basicFile"),
	"image-text-to-text": snippetConversational,
	"image-to-image": snippetGenerator("imageToImage", prepareImageToImageInput),
	"image-to-text": snippetGenerator("basicFile"),
	"object-detection": snippetGenerator("basicFile"),
	"question-answering": snippetGenerator("basic"),
	"sentence-similarity": snippetGenerator("basic"),
	summarization: snippetGenerator("basic"),
	"tabular-classification": snippetGenerator("tabular"),
	"tabular-regression": snippetGenerator("tabular"),
	"table-question-answering": snippetGenerator("basic"),
	"text-classification": snippetGenerator("basic"),
	"text-generation": snippetGenerator("basic"),
	"text-to-audio": snippetGenerator("textToAudio"),
	"text-to-image": snippetGenerator("textToImage"),
	"text-to-speech": snippetGenerator("textToAudio"),
	"text-to-video": snippetGenerator("textToVideo"),
	"text2text-generation": snippetGenerator("basic"),
	"token-classification": snippetGenerator("basic"),
	translation: snippetGenerator("basic"),
	"zero-shot-classification": snippetGenerator("zeroShotClassification"),
	"zero-shot-image-classification": snippetGenerator("zeroShotImageClassification"),
};
export function getPythonInferenceSnippet(
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string,
	opts?: Record<string, unknown>
): InferenceSnippet[] {
	const snippets = model.tags.includes("conversational")
		? snippetConversational(model, accessToken, provider, providerModelId, opts)
		: model.pipeline_tag && model.pipeline_tag in pythonSnippets
		  ? pythonSnippets[model.pipeline_tag]?.(model, accessToken, provider, providerModelId) ?? []
		  : [];

	return snippets.map((snippet) => addImportsToSnippet(snippet, model, accessToken, provider));
}

const addImportsToSnippet = (
	snippet: InferenceSnippet,
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider
): InferenceSnippet => {
	let importSection: string | undefined = undefined;
	if (snippet.client === "huggingface_hub") {
		importSection = snippetImportInferenceClient({ accessToken, provider });
	} else if (snippet.content.includes("requests")) {
		importSection = snippetImportRequests({
			accessToken,
			model: model,
			provider,
			importBase64: snippet.content.includes("base64"),
		});
	}
	return {
		...snippet,
		content: importSection ? `${importSection}\n\n${snippet.content}` : snippet.content,
	};
};
