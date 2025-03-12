import type { PipelineType, WidgetType } from "@huggingface/tasks/src/pipelines.js";
import type { ChatCompletionInputMessage, GenerationParameters } from "@huggingface/tasks/src/tasks/index.js";
import { type InferenceSnippet, type ModelDataMinimal, getModelInputSnippet } from "@huggingface/tasks";
import type { InferenceProvider } from "../types";
import { Template } from "@huggingface/jinja";
import { makeRequestOptionsFromResolvedModel } from "../lib/makeRequestOptions";
import fs from "fs";
import path from "path";
import { existsSync as pathExists } from "node:fs";

const TOOLS = ["huggingface_hub", "requests", "fal_client", "openai"];

type InputPreparationFn = (model: ModelDataMinimal, opts?: Record<string, unknown>) => object;
interface TemplateParams {
	accessToken?: string;
	authorizationHeader?: string;
	baseUrl?: string;
	fullUrl?: string;
	inputs?: object;
	model?: ModelDataMinimal;
	provider?: InferenceProvider;
	providerModelId?: string;
	methodName?: string; // specific to snippetBasic
	importBase64?: boolean; // specific to snippetImportRequests
}

// Helpers to find + load templates

const rootDirFinder = (): string => {
	let currentPath =
		typeof import.meta !== "undefined" && import.meta.url
			? path.normalize(new URL(import.meta.url).pathname) /// for ESM
			: __dirname; /// for CJS

	while (currentPath !== "/") {
		if (pathExists(path.join(currentPath, "package.json"))) {
			return currentPath;
		}

		currentPath = path.normalize(path.join(currentPath, ".."));
	}

	return "/";
};

const templatePath = (tool: string, templateName: string): string =>
	path.join(rootDirFinder(), "src", "snippets", "templates", "python", tool, `${templateName}.jinja`);
const hasTemplate = (tool: string, templateName: string): boolean => pathExists(templatePath(tool, templateName));

const loadTemplate = (tool: string, templateName: string): ((data: TemplateParams) => string) => {
	const template = fs.readFileSync(templatePath(tool, templateName), "utf8");
	return (data: TemplateParams) => new Template(template).render({ ...data });
};

const snippetImportInferenceClient = loadTemplate("huggingface_hub", "importInferenceClient");
const snippetImportRequests = loadTemplate("requests", "importRequests");

// Needed for huggingface_hub basic snippets

const HFH_INFERENCE_CLIENT_METHODS: Partial<Record<WidgetType, string>> = {
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

// Snippet generators
const snippetGenerator = (templateName: string, inputPreparationFn?: InputPreparationFn) => {
	return (
		model: ModelDataMinimal,
		accessToken: string,
		provider: InferenceProvider,
		providerModelId?: string,
		opts?: Record<string, unknown>
	): InferenceSnippet[] => {
		/// Hacky: hard-code conversational templates here
		if (
			model.pipeline_tag &&
			["text-generation", "image-text-to-text"].includes(model.pipeline_tag) &&
			model.tags.includes("conversational")
		) {
			templateName = opts?.streaming ? "conversationalStream" : "conversational";
			inputPreparationFn = prepareConversationalInput;
		}

		/// Prepare inputs + make request
		const inputs = inputPreparationFn ? inputPreparationFn(model, opts) : { inputs: getModelInputSnippet(model) };
		const request = makeRequestOptionsFromResolvedModel(
			providerModelId ?? model.id,
			{ accessToken: accessToken, model: providerModelId, provider: provider, ...inputs },
			{ chatCompletion: templateName.includes("conversational"), task: model.pipeline_tag }
		);

		/// Prepare template injection data
		const params: TemplateParams = {
			accessToken,
			authorizationHeader: request.info.headers?.Authorization!,
			baseUrl: removeSuffix(request.url, "/chat/completions"),
			fullUrl: request.url,
			inputs: {
				asObj: inputs,
				asJsonString: formatBody(inputs, "json"),
				asPythonString: indentString(formatBody(inputs, "python"), 4),
			},
			model,
			provider,
			providerModelId: providerModelId ?? model.id,
		};

		/// Iterate over tools => check if a snippet exists => generate
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

			/// Handle import section separately
			let snippet = template(params).trim();
			if (tool === "huggingface_hub") {
				const importSection = snippetImportInferenceClient({ ...params });
				snippet = `${importSection}\n\n${snippet}`;
			} else if (tool === "requests") {
				const importSection = snippetImportRequests({
					...params,
					importBase64: snippet.includes("base64"),
				});
				snippet = `${importSection}\n\n${snippet}`;
			}

			/// Snippet is ready!
			return { client: tool, content: snippet };
		}).filter((snippet) => snippet !== undefined && snippet.content) as InferenceSnippet[];
	};
};

const prepareDocumentQuestionAnsweringInput = (model: ModelDataMinimal): object => {
	return JSON.parse(getModelInputSnippet(model) as string);
};

const prepareImageToImageInput = (model: ModelDataMinimal): object => {
	return JSON.parse(getModelInputSnippet(model) as string);
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
		max_tokens: opts?.max_tokens ?? 500,
		...(opts?.top_p ? { top_p: opts?.top_p } : undefined),
	};
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
	"image-text-to-text": snippetGenerator("conversational"),
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
	return model.pipeline_tag && model.pipeline_tag in pythonSnippets
		? pythonSnippets[model.pipeline_tag]?.(model, accessToken, provider, providerModelId, opts) ?? []
		: [];
}

function formatBody(obj: object, format: "python" | "json" | "js" | "curl"): string {
	if (format === "python") {
		return Object.entries(obj)
			.map(([key, value]) => {
				const formattedValue = JSON.stringify(value, null, 4).replace(/"/g, '"');
				return `${key}=${formattedValue},`;
			})
			.join("\n");
	}

	if (format === "js") {
		return JSON.stringify({ provider: "together", ...obj }, null, 4).replace(/"([^(")]+)":/g, "$1:");
	}

	if (format === "json") {
		/// Hacky: remove outer brackets
		return JSON.stringify(obj, null, 4).split("\n").slice(1, -1).join("\n");
	}

	if (format === "curl") {
		return `'${JSON.stringify(obj, null, 4)}'`;
	}

	throw new Error("Unsupported format");
}

function indentString(str: string, indent: number): string {
	return str
		.split("\n")
		.map((line) => " ".repeat(indent) + line)
		.join("\n");
}

function removeSuffix(str: string, suffix: string) {
	return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;
}
