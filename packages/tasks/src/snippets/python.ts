import type { PipelineType } from "../pipelines.js";
import { getModelInputSnippet } from "./inputs.js";
import type { ModelDataMinimal } from "./types.js";

// Import snippets

const snippetImportInferenceClient = (model: ModelDataMinimal, accessToken: string): string =>
	`from huggingface_hub import InferenceClient

client = InferenceClient(${model.id}, token="${accessToken || "{API_TOKEN}"}")
`;

const snippetImportConversationalInferenceClient = (model: ModelDataMinimal, accessToken: string): string =>
	// Same but uses OpenAI convention
	`from huggingface_hub import InferenceClient

client = InferenceClient(api_key="${accessToken || "{API_TOKEN}"}")
`;

const snippetImportRequests = (model: ModelDataMinimal, accessToken: string): string =>
	`import requests

API_URL = "https://api-inference.huggingface.co/models/${model.id}"
headers = {"Authorization": ${accessToken ? `"Bearer ${accessToken}"` : `f"Bearer {API_TOKEN}"`}}`;

export const snippetConversational = (model: ModelDataMinimal): string =>
	`for message in client.chat_completion(
	model="${model.id}",
	messages=[{"role": "user", "content": "What is the capital of France?"}],
	max_tokens=500,
	stream=True,
):
    print(message.choices[0].delta.content, end="")`;

// InferenceClient-based snippets

export const snippetConversationalWithImage = (model: ModelDataMinimal): string =>
	`image_url = "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"

for message in client.chat_completion(
	model="${model.id}",
	messages=[
		{
			"role": "user",
			"content": [
				{"type": "image_url", "image_url": {"url": image_url}},
				{"type": "text", "text": "Describe this image in one sentence."},
			],
		}
	],
	max_tokens=500,
	stream=True,
):
	print(message.choices[0].delta.content, end="")`;

export const snippetDocumentQuestionAnswering = (): string =>
	`output = client.document_question_answering("cat.png", "What is in this image?")`;

export const snippetTabularClassification = (model: ModelDataMinimal): string =>
	`output = client.tabular_classification(${getModelInputSnippet(model)})`;

export const snippetTabularRegression = (model: ModelDataMinimal): string =>
	`output = client.tabular_regression(${getModelInputSnippet(model)})`;
export const snippetTextToImage = (model: ModelDataMinimal): string =>
	`# output is a PIL.Image object
image = client.text_to_image(${getModelInputSnippet(model)})`;

export const snippetZeroShotClassification = (model: ModelDataMinimal): string =>
	`text = ${getModelInputSnippet(model)}
labels = ["refund", "legal", "faq"]
output = client.zero_shot_classification(text, labels)`;

export const snippetZeroShotImageClassification = (model: ModelDataMinimal): string =>
	`image = ${getModelInputSnippet(model)}
labels = ["cat", "dog", "llama"]
output = client.zero_shot_image_classification(image, labels)`;

// requests-based snippets

export const snippetBasic = (model: ModelDataMinimal): string =>
	`def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()
	
output = query({
	"inputs": ${getModelInputSnippet(model)},
})`;

export const snippetFile = (model: ModelDataMinimal): string =>
	`def query(filename):
    with open(filename, "rb") as f:
        data = f.read()
    response = requests.post(API_URL, headers=headers, data=data)
    return response.json()

output = query(${getModelInputSnippet(model)})`;

export const snippetTextToAudio = (model: ModelDataMinimal): string => {
	// Transformers TTS pipeline and api-inference-community (AIC) pipeline outputs are diverged
	// with the latest update to inference-api (IA).
	// Transformers IA returns a byte object (wav file), whereas AIC returns wav and sampling_rate.
	if (model.library_name === "transformers") {
		return `def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content

audio_bytes = query({
	"inputs": ${getModelInputSnippet(model)},
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio_bytes)`;
	} else {
		return `def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()
	
audio, sampling_rate = query({
	"inputs": ${getModelInputSnippet(model)},
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio, rate=sampling_rate)`;
	}
};

const PIPELINES_USING_INFERENCE_CLIENT: PipelineType[] = [
	"document-question-answering",
	"tabular-classification",
	"tabular-regression",
	"text-to-image",
	"zero-shot-classification",
	"zero-shot-image-classification",
];

export const pythonSnippets: Partial<Record<PipelineType, (model: ModelDataMinimal) => string>> = {
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
	"image-text-to-text": snippetConversationalWithImage,
	"fill-mask": snippetBasic,
	"sentence-similarity": snippetBasic,
	"automatic-speech-recognition": snippetFile,
	"text-to-image": snippetTextToImage,
	"text-to-speech": snippetTextToAudio,
	"text-to-audio": snippetTextToAudio,
	"audio-to-audio": snippetFile,
	"audio-classification": snippetFile,
	"image-classification": snippetFile,
	"tabular-regression": snippetTabularRegression,
	"tabular-classification": snippetTabularClassification,
	"object-detection": snippetFile,
	"image-segmentation": snippetFile,
	"document-question-answering": snippetDocumentQuestionAnswering,
	"image-to-text": snippetFile,
	"zero-shot-image-classification": snippetZeroShotImageClassification,
};

export function getPythonInferenceSnippet(model: ModelDataMinimal, accessToken: string): string {
	// Specific case for chat completion snippets
	const isConversational =
		"conversational" in model.tags &&
		model.pipeline_tag &&
		model.pipeline_tag in ["text-generation", "image-text-to-text"];

	// Determine the import snippet based on model tags and pipeline tag
	const getImportSnippet = () => {
		if (isConversational) {
			return snippetImportConversationalInferenceClient(model, accessToken);
		} else if (model.pipeline_tag && model.pipeline_tag in PIPELINES_USING_INFERENCE_CLIENT) {
			return snippetImportInferenceClient(model, accessToken);
		} else {
			return snippetImportRequests(model, accessToken);
		}
	};

	// Determine the body snippet based on model tags and pipeline tag
	const getBodySnippet = () => {
		if (isConversational) {
			return model.pipeline_tag === "text-generation"
				? snippetConversational(model)
				: snippetConversationalWithImage(model);
		} else if (model.pipeline_tag && model.pipeline_tag in pythonSnippets) {
			return pythonSnippets[model.pipeline_tag]?.(model) ?? "";
		} else {
			return "";
		}
	};

	// Combine import and body snippets with newline separation
	return `${getImportSnippet()}\n\n${getBodySnippet()}`;
}

export function hasPythonInferenceSnippet(model: ModelDataMinimal): boolean {
	return !!model.pipeline_tag && model.pipeline_tag in pythonSnippets;
}
