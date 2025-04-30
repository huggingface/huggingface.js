import { Template } from "@huggingface/jinja";
import {
	type InferenceSnippet,
	type InferenceSnippetLanguage,
	type ModelDataMinimal,
	getModelInputSnippet,
	inferenceSnippetLanguages,
} from "@huggingface/tasks";
import type { PipelineType, WidgetType } from "@huggingface/tasks/src/pipelines.js";
import type { ChatCompletionInputMessage, GenerationParameters } from "@huggingface/tasks/src/tasks/index.js";
import type { InferenceProviderModelMapping } from "../lib/getInferenceProviderMapping";
import { getProviderHelper } from "../lib/getProviderHelper";
import { makeRequestOptionsFromResolvedModel } from "../lib/makeRequestOptions";
import type { InferenceProvider, InferenceTask, RequestArgs } from "../types";
import { templates } from "./templates.exported";

export type InferenceSnippetOptions = { streaming?: boolean; billTo?: string } & Record<string, unknown>;

const PYTHON_CLIENTS = ["huggingface_hub", "fal_client", "requests", "openai"] as const;
const JS_CLIENTS = ["fetch", "huggingface.js", "openai"] as const;
const SH_CLIENTS = ["curl"] as const;

type Client = (typeof SH_CLIENTS)[number] | (typeof PYTHON_CLIENTS)[number] | (typeof JS_CLIENTS)[number];

const CLIENTS: Record<InferenceSnippetLanguage, Client[]> = {
	js: [...JS_CLIENTS],
	python: [...PYTHON_CLIENTS],
	sh: [...SH_CLIENTS],
};

type InputPreparationFn = (model: ModelDataMinimal, opts?: Record<string, unknown>) => object;
interface TemplateParams {
	accessToken?: string;
	authorizationHeader?: string;
	baseUrl?: string;
	fullUrl?: string;
	inputs?: object;
	providerInputs?: object;
	model?: ModelDataMinimal;
	provider?: InferenceProvider;
	providerModelId?: string;
	billTo?: string;
	methodName?: string; // specific to snippetBasic
	importBase64?: boolean; // specific to snippetImportRequests
	importJson?: boolean; // specific to snippetImportRequests
}

// Helpers to find + load templates

const hasTemplate = (language: InferenceSnippetLanguage, client: Client, templateName: string): boolean =>
	templates[language]?.[client]?.[templateName] !== undefined;

const loadTemplate = (
	language: InferenceSnippetLanguage,
	client: Client,
	templateName: string
): ((data: TemplateParams) => string) => {
	const template = templates[language]?.[client]?.[templateName];
	if (!template) {
		throw new Error(`Template not found: ${language}/${client}/${templateName}`);
	}
	return (data: TemplateParams) => new Template(template).render({ ...data });
};

const snippetImportPythonInferenceClient = loadTemplate("python", "huggingface_hub", "importInferenceClient");
const snippetImportRequests = loadTemplate("python", "requests", "importRequests");

// Needed for huggingface_hub basic snippets

const HF_PYTHON_METHODS: Partial<Record<WidgetType, string>> = {
	"audio-classification": "audio_classification",
	"audio-to-audio": "audio_to_audio",
	"automatic-speech-recognition": "automatic_speech_recognition",
	"document-question-answering": "document_question_answering",
	"feature-extraction": "feature_extraction",
	"fill-mask": "fill_mask",
	"image-classification": "image_classification",
	"image-segmentation": "image_segmentation",
	"image-to-image": "image_to_image",
	"image-to-text": "image_to_text",
	"object-detection": "object_detection",
	"question-answering": "question_answering",
	"sentence-similarity": "sentence_similarity",
	summarization: "summarization",
	"table-question-answering": "table_question_answering",
	"tabular-classification": "tabular_classification",
	"tabular-regression": "tabular_regression",
	"text-classification": "text_classification",
	"text-generation": "text_generation",
	"text-to-image": "text_to_image",
	"text-to-speech": "text_to_speech",
	"text-to-video": "text_to_video",
	"token-classification": "token_classification",
	translation: "translation",
	"visual-question-answering": "visual_question_answering",
	"zero-shot-classification": "zero_shot_classification",
	"zero-shot-image-classification": "zero_shot_image_classification",
};

// Needed for huggingface.js basic snippets

const HF_JS_METHODS: Partial<Record<WidgetType, string>> = {
	"automatic-speech-recognition": "automaticSpeechRecognition",
	"feature-extraction": "featureExtraction",
	"fill-mask": "fillMask",
	"image-classification": "imageClassification",
	"question-answering": "questionAnswering",
	"sentence-similarity": "sentenceSimilarity",
	summarization: "summarization",
	"table-question-answering": "tableQuestionAnswering",
	"text-classification": "textClassification",
	"text-generation": "textGeneration",
	"text2text-generation": "textGeneration",
	"token-classification": "tokenClassification",
	"text-to-speech": "textToSpeech",
	translation: "translation",
};

// Snippet generators
const snippetGenerator = (templateName: string, inputPreparationFn?: InputPreparationFn) => {
	return (
		model: ModelDataMinimal,
		accessToken: string,
		provider: InferenceProvider,
		inferenceProviderMapping?: InferenceProviderModelMapping,
		opts?: InferenceSnippetOptions
	): InferenceSnippet[] => {
		const providerModelId = inferenceProviderMapping?.providerId ?? model.id;
		/// Hacky: hard-code conversational templates here
		let task = model.pipeline_tag as InferenceTask;
		if (
			model.pipeline_tag &&
			["text-generation", "image-text-to-text"].includes(model.pipeline_tag) &&
			model.tags.includes("conversational")
		) {
			templateName = opts?.streaming ? "conversationalStream" : "conversational";
			inputPreparationFn = prepareConversationalInput;
			task = "conversational";
		}
		let providerHelper: ReturnType<typeof getProviderHelper>;
		try {
			providerHelper = getProviderHelper(provider, task);
		} catch (e) {
			console.error(`Failed to get provider helper for ${provider} (${task})`, e);
			return [];
		}
		/// Prepare inputs + make request
		const inputs = inputPreparationFn ? inputPreparationFn(model, opts) : { inputs: getModelInputSnippet(model) };
		const request = makeRequestOptionsFromResolvedModel(
			providerModelId,
			providerHelper,
			{
				accessToken,
				provider,
				...inputs,
			} as RequestArgs,
			inferenceProviderMapping,
			{
				task,
				billTo: opts?.billTo,
			}
		);

		/// Parse request.info.body if not a binary.
		/// This is the body sent to the provider. Important for snippets with raw payload (e.g curl, requests, etc.)
		let providerInputs = inputs;
		const bodyAsObj = request.info.body;
		if (typeof bodyAsObj === "string") {
			try {
				providerInputs = JSON.parse(bodyAsObj);
			} catch (e) {
				console.error("Failed to parse body as JSON", e);
			}
		}

		/// Prepare template injection data
		const params: TemplateParams = {
			accessToken,
			authorizationHeader: (request.info.headers as Record<string, string>)?.Authorization,
			baseUrl: removeSuffix(request.url, "/chat/completions"),
			fullUrl: request.url,
			inputs: {
				asObj: inputs,
				asCurlString: formatBody(inputs, "curl"),
				asJsonString: formatBody(inputs, "json"),
				asPythonString: formatBody(inputs, "python"),
				asTsString: formatBody(inputs, "ts"),
			},
			providerInputs: {
				asObj: providerInputs,
				asCurlString: formatBody(providerInputs, "curl"),
				asJsonString: formatBody(providerInputs, "json"),
				asPythonString: formatBody(providerInputs, "python"),
				asTsString: formatBody(providerInputs, "ts"),
			},
			model,
			provider,
			providerModelId: providerModelId ?? model.id,
			billTo: opts?.billTo,
		};

		/// Iterate over clients => check if a snippet exists => generate
		return inferenceSnippetLanguages
			.map((language) => {
				return CLIENTS[language]
					.map((client) => {
						if (!hasTemplate(language, client, templateName)) {
							return;
						}
						const template = loadTemplate(language, client, templateName);
						if (client === "huggingface_hub" && templateName.includes("basic")) {
							if (!(model.pipeline_tag && model.pipeline_tag in HF_PYTHON_METHODS)) {
								return;
							}
							params["methodName"] = HF_PYTHON_METHODS[model.pipeline_tag];
						}

						if (client === "huggingface.js" && templateName.includes("basic")) {
							if (!(model.pipeline_tag && model.pipeline_tag in HF_JS_METHODS)) {
								return;
							}
							params["methodName"] = HF_JS_METHODS[model.pipeline_tag];
						}

						/// Generate snippet
						let snippet = template(params).trim();
						if (!snippet) {
							return;
						}

						/// Add import section separately
						if (client === "huggingface_hub") {
							const importSection = snippetImportPythonInferenceClient({ ...params });
							snippet = `${importSection}\n\n${snippet}`;
						} else if (client === "requests") {
							const importSection = snippetImportRequests({
								...params,
								importBase64: snippet.includes("base64"),
								importJson: snippet.includes("json."),
							});
							snippet = `${importSection}\n\n${snippet}`;
						}

						/// Snippet is ready!
						return { language, client: client as string, content: snippet };
					})
					.filter((snippet): snippet is InferenceSnippet => snippet !== undefined);
			})
			.flat();
	};
};

const prepareDocumentQuestionAnsweringInput = (model: ModelDataMinimal): object => {
	return JSON.parse(getModelInputSnippet(model) as string);
};

const prepareImageToImageInput = (model: ModelDataMinimal): object => {
	const data = JSON.parse(getModelInputSnippet(model) as string);
	return { inputs: data.image, parameters: { prompt: data.prompt } };
};

const prepareConversationalInput = (
	model: ModelDataMinimal,
	opts?: {
		streaming?: boolean;
		messages?: ChatCompletionInputMessage[];
		temperature?: GenerationParameters["temperature"];
		max_tokens?: GenerationParameters["max_new_tokens"];
		top_p?: GenerationParameters["top_p"];
	}
): object => {
	return {
		messages: opts?.messages ?? getModelInputSnippet(model),
		...(opts?.temperature ? { temperature: opts?.temperature } : undefined),
		...(opts?.max_tokens ? { max_tokens: opts?.max_tokens } : undefined),
		...(opts?.top_p ? { top_p: opts?.top_p } : undefined),
	};
};

const snippets: Partial<
	Record<
		PipelineType,
		(
			model: ModelDataMinimal,
			accessToken: string,
			provider: InferenceProvider,
			inferenceProviderMapping?: InferenceProviderModelMapping,
			opts?: InferenceSnippetOptions
		) => InferenceSnippet[]
	>
> = {
	"audio-classification": snippetGenerator("basicAudio"),
	"audio-to-audio": snippetGenerator("basicAudio"),
	"automatic-speech-recognition": snippetGenerator("basicAudio"),
	"document-question-answering": snippetGenerator("documentQuestionAnswering", prepareDocumentQuestionAnsweringInput),
	"feature-extraction": snippetGenerator("basic"),
	"fill-mask": snippetGenerator("basic"),
	"image-classification": snippetGenerator("basicImage"),
	"image-segmentation": snippetGenerator("basicImage"),
	"image-text-to-text": snippetGenerator("conversational"),
	"image-to-image": snippetGenerator("imageToImage", prepareImageToImageInput),
	"image-to-text": snippetGenerator("basicImage"),
	"object-detection": snippetGenerator("basicImage"),
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
	"text-to-speech": snippetGenerator("textToSpeech"),
	"text-to-video": snippetGenerator("textToVideo"),
	"text2text-generation": snippetGenerator("basic"),
	"token-classification": snippetGenerator("basic"),
	translation: snippetGenerator("basic"),
	"zero-shot-classification": snippetGenerator("zeroShotClassification"),
	"zero-shot-image-classification": snippetGenerator("zeroShotImageClassification"),
};

export function getInferenceSnippets(
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider,
	inferenceProviderMapping?: InferenceProviderModelMapping,
	opts?: Record<string, unknown>
): InferenceSnippet[] {
	return model.pipeline_tag && model.pipeline_tag in snippets
		? snippets[model.pipeline_tag]?.(model, accessToken, provider, inferenceProviderMapping, opts) ?? []
		: [];
}

// String manipulation helpers

function formatBody(obj: object, format: "curl" | "json" | "python" | "ts"): string {
	switch (format) {
		case "curl":
			return indentString(formatBody(obj, "json"));

		case "json":
			/// Hacky: remove outer brackets to make is extendable in templates
			return JSON.stringify(obj, null, 4).split("\n").slice(1, -1).join("\n");

		case "python":
			return indentString(
				Object.entries(obj)
					.map(([key, value]) => {
						const formattedValue = JSON.stringify(value, null, 4).replace(/"/g, '"');
						return `${key}=${formattedValue},`;
					})
					.join("\n")
			);

		case "ts":
			/// Hacky: remove outer brackets to make is extendable in templates
			return formatTsObject(obj).split("\n").slice(1, -1).join("\n");

		default:
			throw new Error(`Unsupported format: ${format}`);
	}
}

function formatTsObject(obj: unknown, depth?: number): string {
	depth = depth ?? 0;

	/// Case int, boolean, string, etc.
	if (typeof obj !== "object" || obj === null) {
		return JSON.stringify(obj);
	}

	/// Case array
	if (Array.isArray(obj)) {
		const items = obj
			.map((item) => {
				const formatted = formatTsObject(item, depth + 1);
				return `${" ".repeat(4 * (depth + 1))}${formatted},`;
			})
			.join("\n");
		return `[\n${items}\n${" ".repeat(4 * depth)}]`;
	}

	/// Case mapping
	const entries = Object.entries(obj);
	const lines = entries
		.map(([key, value]) => {
			const formattedValue = formatTsObject(value, depth + 1);
			const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
			return `${" ".repeat(4 * (depth + 1))}${keyStr}: ${formattedValue},`;
		})
		.join("\n");
	return `{\n${lines}\n${" ".repeat(4 * depth)}}`;
}

function indentString(str: string): string {
	return str
		.split("\n")
		.map((line) => " ".repeat(4) + line)
		.join("\n");
}

function removeSuffix(str: string, suffix: string) {
	return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;
}
