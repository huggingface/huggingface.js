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
	configStr?: string;
	importInferenceClient?: string;
	inputs?: string | ChatCompletionInputMessage[];
	messagesStr?: string;
	methodName?: string;
	modelId?: string;
	provider?: InferenceProvider;
	question?: string;
	importBase64?: boolean;
}

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

const loadTemplate = (language: string, tool: string, templateName: string): ((data: TemplateParams) => string) => {
	const templatePath = path.join(
		rootDirFinder(),
		"src",
		"snippets",
		"templates",
		language,
		tool,
		`${templateName}.hbs`
	);
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

const snippetImportInferenceClient = loadTemplate("python", "huggingface_hub", "importInferenceClient");
const snippetInferenceClientAutomaticSpeechRecognition = loadTemplate(
	"python",
	"huggingface_hub",
	"automaticSpeechRecognition"
);
const snippetInferenceClientBasic = loadTemplate("python", "huggingface_hub", "basic");
const snippetInferenceClientImageToImage = loadTemplate("python", "huggingface_hub", "imageToImage");
const snippetInferenceClientTextToImage = loadTemplate("python", "huggingface_hub", "textToImage");
const snippetInferenceClientTextToVideo = loadTemplate("python", "huggingface_hub", "textToVideo");
const snippetInferenceClientConversational = loadTemplate("python", "huggingface_hub", "conversational");
const snippetInferenceClientConversationalStream = loadTemplate("python", "huggingface_hub", "conversationalStream");
const snippetInferenceClientDocumentQuestionAnswering = loadTemplate(
	"python",
	"huggingface_hub",
	"documentQuestionAnswering"
);

const snippetFalAITextToImage = loadTemplate("python", "fal_ai", "textToImage");

const snippetOpenAIConversational = loadTemplate("python", "openai", "conversational");
const snippetOpenAIConversationalStream = loadTemplate("python", "openai", "conversationalStream");

const snippetImportRequests = loadTemplate("python", "requests", "importRequests");
const snippetRequestsBasic = loadTemplate("python", "requests", "basic");
const snippetRequestsBasicFile = loadTemplate("python", "requests", "basicFile");
const snippetRequestsDocumentQuestionAnswering = loadTemplate("python", "requests", "documentQuestionAnswering");
const snippetRequestsImageToImage = loadTemplate("python", "requests", "imageToImage");
const snippetRequestsTabular = loadTemplate("python", "requests", "tabular");
const snippetRequestsTextToImage = loadTemplate("python", "requests", "textToImage");
const snippetRequestsTextToAudioOther = loadTemplate("python", "requests", "textToAudioOther");
const snippetRequestsTextToAudioTransformers = loadTemplate("python", "requests", "textToAudioTransformers");
const snippetRequestZeroShotClassification = loadTemplate("python", "requests", "zeroShotClassification");
const snippetRequestZeroShotImageClassification = loadTemplate("python", "requests", "zeroShotImageClassification");

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
	const messagesStr = stringifyMessages(messages, { attributeKeyQuotes: true });

	const config = {
		...(opts?.temperature ? { temperature: opts.temperature } : undefined),
		max_tokens: opts?.max_tokens ?? 500,
		...(opts?.top_p ? { top_p: opts.top_p } : undefined),
	};
	const configStr = stringifyGenerationConfig(config, {
		indent: "\n\t",
		attributeValueConnector: "=",
	});

	if (streaming) {
		return [
			{
				client: "huggingface_hub",
				content: snippetInferenceClientConversationalStream({
					accessToken,
					provider,
					modelId: model.id,
					messagesStr,
					configStr,
				}),
			},
			{
				client: "openai",
				content: snippetOpenAIConversationalStream({
					accessToken,
					provider,
					modelId: providerModelId ?? model.id,
					messagesStr,
					configStr,
					baseUrl: openAIbaseUrl(provider),
				}),
			},
		];
	} else {
		return [
			{
				client: "huggingface_hub",
				content: snippetInferenceClientConversational({
					accessToken,
					provider,
					modelId: model.id,
					messagesStr,
					configStr,
				}),
			},
			{
				client: "openai",
				content: snippetOpenAIConversational({
					accessToken,
					provider,
					modelId: providerModelId ?? model.id,
					messagesStr,
					configStr,
					baseUrl: openAIbaseUrl(provider),
				}),
			},
		];
	}
};

const snippetZeroShotClassification = (model: ModelDataMinimal): InferenceSnippet[] => {
	return [
		{
			client: "requests",
			content: snippetRequestZeroShotClassification({
				inputs: getModelInputSnippet(model),
			}),
		},
	];
};

const snippetZeroShotImageClassification = (model: ModelDataMinimal): InferenceSnippet[] => {
	return [
		{
			client: "requests",
			content: snippetRequestZeroShotImageClassification({
				inputs: getModelInputSnippet(model),
			}),
		},
	];
};

const snippetBasic = (model: ModelDataMinimal): InferenceSnippet[] => {
	return [
		...(model.pipeline_tag && model.pipeline_tag in HFH_INFERENCE_CLIENT_METHODS
			? [
					{
						client: "huggingface_hub",
						content: snippetInferenceClientBasic({
							inputs: getModelInputSnippet(model),
							modelId: model.id,
							methodName: HFH_INFERENCE_CLIENT_METHODS[model.pipeline_tag],
						}),
					},
			  ]
			: []),
		{
			client: "requests",
			content: snippetRequestsBasic({
				inputs: getModelInputSnippet(model),
			}),
		},
	];
};

const snippetFile = (model: ModelDataMinimal): InferenceSnippet[] => {
	return [
		{
			client: "requests",
			content: snippetRequestsBasicFile({
				inputs: getModelInputSnippet(model),
			}),
		},
	];
};

const snippetTextToImage = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	providerModelId?: string
): InferenceSnippet[] => {
	return [
		{
			client: "huggingface_hub",
			content: snippetInferenceClientTextToImage({
				inputs: getModelInputSnippet(model),
				modelId: model.id,
			}),
		},
		...(provider === "fal-ai"
			? [
					{
						client: "fal-client",
						content: snippetFalAITextToImage({
							modelId: providerModelId ?? model.id,
							inputs: getModelInputSnippet(model),
						}),
					},
			  ]
			: []),
		...(provider === "hf-inference"
			? [
					{
						client: "requests",
						content: snippetRequestsTextToImage({
							inputs: getModelInputSnippet(model),
						}),
					},
			  ]
			: []),
	];
};

const snippetTextToVideo = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider
): InferenceSnippet[] => {
	return ["fal-ai", "replicate"].includes(provider)
		? [
				{
					client: "huggingface_hub",
					content: snippetInferenceClientTextToVideo({
						inputs: getModelInputSnippet(model),
						modelId: model.id,
					}),
				},
		  ]
		: [];
};

const snippetTabular = (model: ModelDataMinimal): InferenceSnippet[] => {
	return [
		{
			client: "requests",
			content: snippetRequestsTabular({
				inputs: getModelInputSnippet(model),
			}),
		},
	];
};

const snippetTextToAudio = (model: ModelDataMinimal): InferenceSnippet[] => {
	// Transformers TTS pipeline and api-inference-community (AIC) pipeline outputs are diverged
	// with the latest update to inference-api (IA).
	// Transformers IA returns a byte object (wav file), whereas AIC returns wav and sampling_rate.
	if (model.library_name === "transformers") {
		return [
			{
				client: "requests",
				content: snippetRequestsTextToAudioTransformers({
					inputs: getModelInputSnippet(model),
				}),
			},
		];
	} else {
		return [
			{
				client: "requests",
				content: snippetRequestsTextToAudioOther({
					inputs: getModelInputSnippet(model),
				}),
			},
		];
	}
};

const snippetAutomaticSpeechRecognition = (model: ModelDataMinimal): InferenceSnippet[] => {
	return [
		{
			client: "huggingface_hub",
			content: snippetInferenceClientAutomaticSpeechRecognition({
				inputs: getModelInputSnippet(model),
				modelId: model.id,
			}),
		},
		snippetFile(model)[0],
	];
};

const snippetDocumentQuestionAnswering = (model: ModelDataMinimal): InferenceSnippet[] => {
	const inputsAsStr = getModelInputSnippet(model) as string;
	const inputsAsObj = JSON.parse(inputsAsStr);

	return [
		{
			client: "huggingface_hub",
			content: snippetInferenceClientDocumentQuestionAnswering({
				inputs: inputsAsObj.image,
				question: inputsAsObj.question,
				modelId: model.id,
			}),
		},
		{
			client: "requests",
			content: snippetRequestsDocumentQuestionAnswering({
				inputs: inputsAsStr,
			}),
		},
	];
};

const snippetImageToImage = (model: ModelDataMinimal): InferenceSnippet[] => {
	const inputsAsStr = getModelInputSnippet(model) as string;
	const inputsAsObj = JSON.parse(inputsAsStr);

	return [
		{
			client: "huggingface_hub",
			content: snippetInferenceClientImageToImage({
				inputs: inputsAsObj,
				modelId: model.id,
			}),
		},
		{
			client: "requests",
			content: snippetRequestsImageToImage({
				inputs: inputsAsObj,
			}),
		},
	];
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
