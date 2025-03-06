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
	provider?: InferenceProvider;
	modelId?: string;
	importInferenceClient?: string;
	messagesStr?: string;
	configStr?: string;
	baseUrl?: string;
	inputs?: string | ChatCompletionInputMessage[];
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
const snippetOpenAIConversational = loadTemplate("python", "openai", "conversational");
const snippetOpenAIConversationalStream = loadTemplate("python", "openai", "conversationalStream");
const snippetInferenceClientConversational = loadTemplate("python", "huggingface_hub", "conversational");
const snippetInferenceClientConversationalStream = loadTemplate("python", "huggingface_hub", "conversationalStream");
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
					importInferenceClient: snippetImportInferenceClient({ accessToken, provider }),
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
					importInferenceClient: snippetImportInferenceClient({ accessToken, provider }),
					messagesStr,
					configStr,
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
					importInferenceClient: snippetImportInferenceClient({ accessToken, provider }),
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

const snippetBasic = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider
): InferenceSnippet[] => {
	return [
		...(model.pipeline_tag && model.pipeline_tag in HFH_INFERENCE_CLIENT_METHODS
			? [
					{
						client: "huggingface_hub",
						content: `\
${snippetImportInferenceClient({ accessToken, provider })}

result = client.${HFH_INFERENCE_CLIENT_METHODS[model.pipeline_tag]}(
	inputs=${getModelInputSnippet(model)},
	model="${model.id}",
)

print(result)
`,
					},
			  ]
			: []),
		{
			client: "requests",
			content: `\
def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()
	
output = query({
	"inputs": ${getModelInputSnippet(model)},
})`,
		},
	];
};

const snippetFile = (model: ModelDataMinimal): InferenceSnippet[] => {
	return [
		{
			client: "requests",
			content: `\
def query(filename):
	with open(filename, "rb") as f:
		data = f.read()
	response = requests.post(API_URL, headers=headers, data=data)
	return response.json()

output = query(${getModelInputSnippet(model)})`,
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
			content: `\
${snippetImportInferenceClient({ accessToken, provider })}

# output is a PIL.Image object
image = client.text_to_image(
	${getModelInputSnippet(model)},
	model="${model.id}",
)`,
		},
		...(provider === "fal-ai"
			? [
					{
						client: "fal-client",
						content: `\
import fal_client

result = fal_client.subscribe(
	"${providerModelId ?? model.id}",
	arguments={
		"prompt": ${getModelInputSnippet(model)},
	},
)
print(result)
`,
					},
			  ]
			: []),
		...(provider === "hf-inference"
			? [
					{
						client: "requests",
						content: `\
def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content

image_bytes = query({
	"inputs": ${getModelInputSnippet(model)},
})

# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))`,
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
					content: `\
${snippetImportInferenceClient({ accessToken, provider })}

video = client.text_to_video(
	${getModelInputSnippet(model)},
	model="${model.id}",
)`,
				},
		  ]
		: [];
};

const snippetTabular = (model: ModelDataMinimal): InferenceSnippet[] => {
	return [
		{
			client: "requests",
			content: `\
def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content

response = query({
	"inputs": {"data": ${getModelInputSnippet(model)}},
})`,
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
				content: `\
def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content

audio_bytes = query({
	"inputs": ${getModelInputSnippet(model)},
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio_bytes)`,
			},
		];
	} else {
		return [
			{
				client: "requests",
				content: `def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()
	
audio, sampling_rate = query({
	"inputs": ${getModelInputSnippet(model)},
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio, rate=sampling_rate)`,
			},
		];
	}
};

const snippetAutomaticSpeechRecognition = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider
): InferenceSnippet[] => {
	return [
		{
			client: "huggingface_hub",
			content: `${snippetImportInferenceClient({ accessToken, provider })}
output = client.automatic_speech_recognition(${getModelInputSnippet(model)}, model="${model.id}")`,
		},
		snippetFile(model)[0],
	];
};

const snippetDocumentQuestionAnswering = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider
): InferenceSnippet[] => {
	const inputsAsStr = getModelInputSnippet(model) as string;
	const inputsAsObj = JSON.parse(inputsAsStr);

	return [
		{
			client: "huggingface_hub",
			content: `${snippetImportInferenceClient({ accessToken, provider })}
output = client.document_question_answering(
    "${inputsAsObj.image}",
	question="${inputsAsObj.question}",
	model="${model.id}",
)`,
		},
		{
			client: "requests",
			content: `def query(payload):
	with open(payload["image"], "rb") as f:
		img = f.read()
		payload["image"] = base64.b64encode(img).decode("utf-8")
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()

output = query({
    "inputs": ${inputsAsStr},
})`,
		},
	];
};

const snippetImageToImage = (
	model: ModelDataMinimal,
	accessToken: string,
	provider: InferenceProvider
): InferenceSnippet[] => {
	const inputsAsStr = getModelInputSnippet(model) as string;
	const inputsAsObj = JSON.parse(inputsAsStr);

	return [
		{
			client: "huggingface_hub",
			content: `${snippetImportInferenceClient({ accessToken, provider })}
# output is a PIL.Image object
image = client.image_to_image(
    "${inputsAsObj.image}",
    prompt="${inputsAsObj.prompt}",
    model="${model.id}",
)`,
		},
		{
			client: "requests",
			content: `def query(payload):
	with open(payload["inputs"], "rb") as f:
		img = f.read()
		payload["inputs"] = base64.b64encode(img).decode("utf-8")
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content

image_bytes = query({
	"inputs": "${inputsAsObj.image}",
	"parameters": {"prompt": "${inputsAsObj.prompt}"},
})

# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))`,
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
	if (model.tags.includes("conversational")) {
		// Conversational model detected, so we display a code snippet that features the Messages API
		return snippetConversational(model, accessToken, provider, providerModelId, opts);
	} else {
		const snippets =
			model.pipeline_tag && model.pipeline_tag in pythonSnippets
				? pythonSnippets[model.pipeline_tag]?.(model, accessToken, provider, providerModelId) ?? []
				: [];

		return snippets.map((snippet) => {
			return {
				...snippet,
				content: addImportsToSnippet(snippet.content, model, accessToken),
			};
		});
	}
}

const addImportsToSnippet = (snippet: string, model: ModelDataMinimal, accessToken: string): string => {
	if (snippet.includes("requests")) {
		snippet = `import requests

API_URL = "https://router.huggingface.co/hf-inference/models/${model.id}"
headers = {"Authorization": ${accessToken ? `"Bearer ${accessToken}"` : `f"Bearer {API_TOKEN}"`}}

${snippet}`;
	}
	if (snippet.includes("base64")) {
		snippet = `import base64
${snippet}`;
	}
	return snippet;
};
