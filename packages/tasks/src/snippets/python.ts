import type { PipelineType } from "../pipelines.js";
import { getModelInputSnippet } from "./inputs.js";
import type { ModelDataMinimal } from "./types.js";

export const snippetConversational = (model: ModelDataMinimal, accessToken: string): string =>
	`from huggingface_hub import InferenceClient

client = InferenceClient(
    "${model.id}",
    token="${accessToken || "{API_TOKEN}"}",
)

for message in client.chat_completion(
	messages=[{"role": "user", "content": "What is the capital of France?"}],
	max_tokens=500,
	stream=True,
):
    print(message.choices[0].delta.content, end="")`;

export const snippetZeroShotClassification = (model: ModelDataMinimal): string =>
	`def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()

output = query({
    "inputs": ${getModelInputSnippet(model)},
    "parameters": {"candidate_labels": ["refund", "legal", "faq"]},
})`;

export const snippetZeroShotImageClassification = (model: ModelDataMinimal): string =>
	`def query(data):
	with open(data["image_path"], "rb") as f:
		img = f.read()
	payload={
		"parameters": data["parameters"],
		"inputs": base64.b64encode(img).decode("utf-8")
	}
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()

output = query({
    "image_path": ${getModelInputSnippet(model)},
    "parameters": {"candidate_labels": ["cat", "dog", "llama"]},
})`;

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

export const snippetTextToImage = (model: ModelDataMinimal): string =>
	`def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content
image_bytes = query({
	"inputs": ${getModelInputSnippet(model)},
})
# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))`;

export const snippetTabular = (model: ModelDataMinimal): string =>
	`def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content
response = query({
	"inputs": {"data": ${getModelInputSnippet(model)}},
})`;

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

export const snippetDocumentQuestionAnswering = (model: ModelDataMinimal): string =>
	`def query(payload):
 	with open(payload["image"], "rb") as f:
  		img = f.read()
		payload["image"] = base64.b64encode(img).decode("utf-8")  
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()

output = query({
    "inputs": ${getModelInputSnippet(model)},
})`;

export const pythonSnippets: Partial<Record<PipelineType, (model: ModelDataMinimal, accessToken: string) => string>> = {
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
	"fill-mask": snippetBasic,
	"sentence-similarity": snippetBasic,
	"automatic-speech-recognition": snippetFile,
	"text-to-image": snippetTextToImage,
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
	"zero-shot-image-classification": snippetZeroShotImageClassification,
};

export function getPythonInferenceSnippet(model: ModelDataMinimal, accessToken: string): string {
	if (model.pipeline_tag === "text-generation" && model.config?.tokenizer_config?.chat_template) {
		// Conversational model detected, so we display a code snippet that features the Messages API
		return snippetConversational(model, accessToken);
	} else {
		const body =
			model.pipeline_tag && model.pipeline_tag in pythonSnippets
				? pythonSnippets[model.pipeline_tag]?.(model, accessToken) ?? ""
				: "";

		return `import requests

API_URL = "https://api-inference.huggingface.co/models/${model.id}"
headers = {"Authorization": ${accessToken ? `"Bearer ${accessToken}"` : `f"Bearer {API_TOKEN}"`}}

${body}`;
	}
}

export function hasPythonInferenceSnippet(model: ModelDataMinimal): boolean {
	return !!model.pipeline_tag && model.pipeline_tag in pythonSnippets;
}
