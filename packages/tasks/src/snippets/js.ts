import type { PipelineType } from "../pipelines.js";
import type { ChatCompletionInputMessage, GenerationParameters } from "../tasks/index.js";
import { getModelInputSnippet } from "./inputs.js";
import type {
	GenerationConfigFormatter,
	GenerationMessagesFormatter,
	InferenceSnippet,
	ModelDataMinimal,
} from "./types.js";

export const snippetBasic = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => ({
	content: `async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/${model.id}",
		{
			headers: {
				Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({"inputs": ${getModelInputSnippet(model)}}).then((response) => {
	console.log(JSON.stringify(response));
});`,
});

const formatGenerationMessages: GenerationMessagesFormatter = ({ messages, sep, start, end }) =>
	start + messages.map(({ role, content }) => `{ role: "${role}", content: "${content}" }`).join(sep) + end;

const formatGenerationConfig: GenerationConfigFormatter = ({ config, sep, start, end }) =>
	start +
	Object.entries(config)
		.map(([key, val]) => `${key}: ${val}`)
		.join(sep) +
	end;

export const snippetTextGeneration = (
	model: ModelDataMinimal,
	accessToken: string,
	opts?: {
		streaming?: boolean;
		messages?: ChatCompletionInputMessage[];
		temperature?: GenerationParameters["temperature"];
		max_tokens?: GenerationParameters["max_tokens"];
		top_p?: GenerationParameters["top_p"];
	}
): InferenceSnippet | InferenceSnippet[] => {
	if (model.tags.includes("conversational")) {
		// Conversational model detected, so we display a code snippet that features the Messages API
		const streaming = opts?.streaming ?? true;
		const messages: ChatCompletionInputMessage[] = opts?.messages ?? [
			{ role: "user", content: "What is the capital of France?" },
		];
		const messagesStr = formatGenerationMessages({ messages, sep: ",\n\t\t", start: "[\n\t\t", end: "\n\t]" });

		const config = {
			temperature: opts?.temperature,
			max_tokens: opts?.max_tokens ?? 500,
			top_p: opts?.top_p,
		};
		const configStr = formatGenerationConfig({ config, sep: ",\n\t", start: "", end: "" });

		if (streaming) {
			return [
				{
					client: "huggingface_hub",
					content: `import { HfInference } from "@huggingface/inference"

const client = new HfInference("${accessToken || `{API_TOKEN}`}")

let out = "";

const stream = client.chatCompletionStream({
	model: "${model.id}",
	messages: ${messagesStr},
	${configStr}
});

for await (const chunk of stream) {
	if (chunk.choices && chunk.choices.length > 0) {
		const newContent = chunk.choices[0].delta.content;
		out += newContent;
		console.log(newContent);
	}  
}`,
				},
				{
					client: "openai",
					content: `import { OpenAI } from "openai"

const client = new OpenAI({
	baseURL: "https://api-inference.huggingface.co/v1/",
    apiKey: "${accessToken || `{API_TOKEN}`}"
})

let out = "";

const stream = await client.chat.completions.create({
	model: "${model.id}",
	messages: ${messagesStr},
	${configStr},
	stream: true,
});

for await (const chunk of stream) {
	if (chunk.choices && chunk.choices.length > 0) {
		const newContent = chunk.choices[0].delta.content;
		out += newContent;
		console.log(newContent);
	}  
}`,
				},
			];
		} else {
			return [
				{
					client: "huggingface_hub",
					content: `import { HfInference } from '@huggingface/inference'

const client = new HfInference("${accessToken || `{API_TOKEN}`}")

const chatCompletion = await client.chatCompletion({
	model: "${model.id}",
	messages: ${messagesStr},
	${configStr}
});

console.log(chatCompletion.choices[0].message);`,
				},
				{
					client: "openai",
					content: `import { OpenAI } from "openai"

const client = new OpenAI({
    baseURL: "https://api-inference.huggingface.co/v1/",
    apiKey: "${accessToken || `{API_TOKEN}`}"
})

const chatCompletion = await client.chat.completions.create({
	model: "${model.id}",
	messages: ${messagesStr},
	${configStr}
});

console.log(chatCompletion.choices[0].message);`,
				},
			];
		}
	} else {
		return snippetBasic(model, accessToken);
	}
};

export const snippetImageTextToTextGeneration = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => {
	if (model.tags.includes("conversational")) {
		// Conversational model detected, so we display a code snippet that features the Messages API
		return {
			content: `import { HfInference } from "@huggingface/inference";

const inference = new HfInference("${accessToken || `{API_TOKEN}`}");
const imageUrl = "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg";

for await (const chunk of inference.chatCompletionStream({
	model: "${model.id}",
	messages: [
		{
			"role": "user",
			"content": [
				{"type": "image_url", "image_url": {"url": imageUrl}},
				{"type": "text", "text": "Describe this image in one sentence."},
			],
		}
	],
	max_tokens: 500,
})) {
	process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`,
		};
	} else {
		return snippetBasic(model, accessToken);
	}
};

export const snippetZeroShotClassification = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => ({
	content: `async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/${model.id}",
		{
			headers: {
				Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({"inputs": ${getModelInputSnippet(
		model
	)}, "parameters": {"candidate_labels": ["refund", "legal", "faq"]}}).then((response) => {
	console.log(JSON.stringify(response));
});`,
});

export const snippetTextToImage = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => ({
	content: `async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/${model.id}",
		{
			headers: {
				Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.blob();
	return result;
}
query({"inputs": ${getModelInputSnippet(model)}}).then((response) => {
	// Use image
});`,
});

export const snippetTextToAudio = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => {
	const commonSnippet = `async function query(data) {
		const response = await fetch(
			"https://api-inference.huggingface.co/models/${model.id}",
			{
				headers: {
					Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
					"Content-Type": "application/json",
				},
				method: "POST",
				body: JSON.stringify(data),
			}
		);`;
	if (model.library_name === "transformers") {
		return {
			content:
				commonSnippet +
				`
			const result = await response.blob();
			return result;
		}
		query({"inputs": ${getModelInputSnippet(model)}}).then((response) => {
			// Returns a byte object of the Audio wavform. Use it directly!
		});`,
		};
	} else {
		return {
			content:
				commonSnippet +
				`
			const result = await response.json();
			return result;
		}
		
		query({"inputs": ${getModelInputSnippet(model)}}).then((response) => {
			console.log(JSON.stringify(response));
		});`,
		};
	}
};

export const snippetFile = (model: ModelDataMinimal, accessToken: string): InferenceSnippet => ({
	content: `async function query(filename) {
	const data = fs.readFileSync(filename);
	const response = await fetch(
		"https://api-inference.huggingface.co/models/${model.id}",
		{
			headers: {
				Authorization: "Bearer ${accessToken || `{API_TOKEN}`}"
				"Content-Type": "application/json",
			},
			method: "POST",
			body: data,
		}
	);
	const result = await response.json();
	return result;
}

query(${getModelInputSnippet(model)}).then((response) => {
	console.log(JSON.stringify(response));
});`,
});

export const jsSnippets: Partial<
	Record<
		PipelineType,
		(
			model: ModelDataMinimal,
			accessToken: string,
			opts?: Record<string, unknown>
		) => InferenceSnippet | InferenceSnippet[]
	>
> = {
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
	"image-text-to-text": snippetImageTextToTextGeneration,
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
	"image-to-text": snippetFile,
	"object-detection": snippetFile,
	"image-segmentation": snippetFile,
};

export function getJsInferenceSnippet(
	model: ModelDataMinimal,
	accessToken: string
): InferenceSnippet | InferenceSnippet[] {
	return model.pipeline_tag && model.pipeline_tag in jsSnippets
		? jsSnippets[model.pipeline_tag]?.(model, accessToken) ?? { content: "" }
		: { content: "" };
}

export function hasJsInferenceSnippet(model: ModelDataMinimal): boolean {
	return !!model.pipeline_tag && model.pipeline_tag in jsSnippets;
}
