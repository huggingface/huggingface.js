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

interface TemplateParams {
	accessToken?: string;
	baseUrl?: string;
	inputs?: string | object;
	modelId?: string;
	provider?: InferenceProvider;
	providerModelId?: string;
	methodName?: string; // specific to snippetBasic
	importBase64?: boolean; // specific to snippetImportRequests
}

interface SnippetTemplateParams {
	accessToken: string;
	baseUrl?: string;
	inputs: string | object;
	model: ModelDataMinimal;
	provider: InferenceProvider;
	providerModelId: string;
}

const TOOLS = ["huggingface_hub", "requests", "fal_client", "openai"];

Handlebars.registerHelper("equals", function (value1, value2) {
	return value1 === value2;
});

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

const loadTemplate = (tool: string, templateName: string): ((data: TemplateParams) => string) | undefined => {
	const templatePath = path.join(
		rootDirFinder(),
		"src",
		"snippets",
		"templates",
		"python",
		tool,
		`${templateName}.hbs`
	);
	if (!pathExists(templatePath)) {
		return;
	}
	const template = fs.readFileSync(templatePath, "utf8");
	return Handlebars.compile<TemplateParams>(template);
};

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

const snippetImportInferenceClient = loadTemplate("huggingface_hub", "importInferenceClient");
const snippetImportRequests = loadTemplate("requests", "importRequests");

const generateSnippets = (templateName: string, params: SnippetTemplateParams): InferenceSnippet[] => {
	return TOOLS.map((tool) => {
		const template = loadTemplate(tool, templateName);
		if (!template) {
			return;
		}
		if (tool === "huggingface_hub" && templateName === "basic") {
			if (!(params.model.pipeline_tag && params.model.pipeline_tag in HFH_INFERENCE_CLIENT_METHODS)) {
				return;
			}
			return {
				client: tool,
				content: template({ ...params, methodName: HFH_INFERENCE_CLIENT_METHODS[params.model.pipeline_tag] }),
			};
		}
		return {
			client: tool,
			content: template(params),
		};
	}).filter((snippet) => snippet !== undefined && snippet.content.trim()) as InferenceSnippet[];
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
	const exampleMessages = getModelInputSnippet(model) as ChatCompletionInputMessage[];
	const messages = opts?.messages ?? exampleMessages;
	const config = {
		...(opts?.temperature ? { temperature: opts.temperature } : undefined),
		max_tokens: opts?.max_tokens ?? 500,
		...(opts?.top_p ? { top_p: opts.top_p } : undefined),
	};

	const params: SnippetTemplateParams = {
		accessToken,
		baseUrl: openAIbaseUrl(provider),
		inputs: {
			messagesStr: stringifyMessages(messages, { attributeKeyQuotes: true }),
			configStr: stringifyGenerationConfig(config, {
				indent: "\n\t",
				attributeValueConnector: "=",
			}),
		},
		model,
		provider,
		providerModelId: providerModelId ?? model.id,
	};
	const templateName = streaming ? "conversationalStream" : "conversational";
	return generateSnippets(templateName, params);
};

const snippetZeroShotClassification = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("zeroShotClassification", {
		accessToken: accessToken,
		inputs: getModelInputSnippet(model),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetZeroShotImageClassification = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("zeroShotImageClassification", {
		accessToken: accessToken,
		inputs: getModelInputSnippet(model),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetBasic = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("basic", {
		accessToken: accessToken,
		inputs: getModelInputSnippet(model),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetFile = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("basicFile", {
		accessToken: accessToken,
		inputs: getModelInputSnippet(model),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetTextToImage = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("textToImage", {
		accessToken: accessToken,
		inputs: getModelInputSnippet(model),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetTextToVideo = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("textToVideo", {
		accessToken: accessToken,
		inputs: getModelInputSnippet(model),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetTabular = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("tabular", {
		accessToken: accessToken,
		inputs: getModelInputSnippet(model),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetTextToAudio = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("textToAudio", {
		accessToken: accessToken,
		inputs: getModelInputSnippet(model),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetAutomaticSpeechRecognition = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("automaticSpeechRecognition", {
		accessToken: accessToken,
		inputs: getModelInputSnippet(model),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetDocumentQuestionAnswering = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	const inputsAsStr = getModelInputSnippet(model) as string;
	const inputsAsObj = JSON.parse(inputsAsStr);
	return generateSnippets("documentQuestionAnswering", {
		accessToken: accessToken,
		inputs: { asObj: inputsAsObj, asStr: inputsAsStr },
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
	});
};

const snippetImageToImage = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return generateSnippets("imageToImage", {
		accessToken: accessToken,
		inputs: JSON.parse(getModelInputSnippet(model) as string),
		model: model,
		provider: provider,
		providerModelId: providerModelId ?? model.id,
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
	// Same order as in tasks/src/pipelines.ts
	"text-classification": snippetBasic,
	"token-classification": snippetBasic,
	"table-question-answering": snippetBasic,
	"question-answering": snippetBasic,
	"zero-shot-classification": snippetZeroShotClassification,
	translation: snippetBasic,
	summarization: snippetBasic,
	"feature-extraction": snippetBasic,
	"text-generation": snippetBasic,
	"text2text-generation": snippetBasic,
	"image-text-to-text": snippetConversational,
	"fill-mask": snippetBasic,
	"sentence-similarity": snippetBasic,
	"automatic-speech-recognition": snippetAutomaticSpeechRecognition,
	"text-to-image": snippetTextToImage,
	"text-to-video": snippetTextToVideo,
	"text-to-speech": snippetTextToAudio,
	"text-to-audio": snippetTextToAudio,
	"audio-to-audio": snippetFile,
	"audio-classification": snippetFile,
	"image-classification": snippetFile,
	"tabular-regression": snippetTabular,
	"tabular-classification": snippetTabular,
	"object-detection": snippetFile,
	"image-segmentation": snippetFile,
	"document-question-answering": snippetDocumentQuestionAnswering,
	"image-to-text": snippetFile,
	"image-to-image": snippetImageToImage,
	"zero-shot-image-classification": snippetZeroShotImageClassification,
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
			modelId: model.id,
			provider,
			importBase64: snippet.content.includes("base64"),
		});
	}
	return {
		...snippet,
		content: importSection ? `${importSection}\n\n${snippet.content}` : snippet.content,
	};
};
