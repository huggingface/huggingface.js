import { BlackForestLabsTextToImageTask } from "../providers/black-forest-labs";
import { CerebrasConversationalTask } from "../providers/cerebras";
import { CohereConversationalTask } from "../providers/cohere";
import { FalAITask, FalAITextToImageTask, FalAITextToVideoTask } from "../providers/fal-ai";
import { FireworksConversationalTask } from "../providers/fireworks-ai";
import { HFInferenceBinaryInputTask, HFInferenceConversationalTask, HFInferenceTask } from "../providers/hf-inference";
import {
	HyperbolicConversationalTask,
	HyperbolicTextGenerationTask,
	HyperbolicTextToImageTask,
} from "../providers/hyperbolic";
import { NebiusConversationalTask, NebiusTextGenerationTask, NebiusTextToImageTask } from "../providers/nebius";
import { NovitaConversationalTask, NovitaTextGenerationTask } from "../providers/novita";
import { OpenAIConversationalTask } from "../providers/openai";
import type { TaskProviderHelper } from "../providers/providerHelper";
import { ReplicateTextToImageTask, ReplicateTextToSpeechTask, ReplicateTextToVideoTask } from "../providers/replicate";
import { SambanovaConversationalTask } from "../providers/sambanova";
import { TogetherConversationalTask, TogetherTextGenerationTask, TogetherTextToImageTask } from "../providers/together";
import type { InferenceProvider, InferenceTask } from "../types";

export const PROVIDERS: Record<InferenceProvider, Partial<Record<InferenceTask, TaskProviderHelper>>> = {
	"black-forest-labs": {
		"text-to-image": new BlackForestLabsTextToImageTask(),
	},
	cerebras: {
		conversational: new CerebrasConversationalTask(),
	},
	cohere: {
		conversational: new CohereConversationalTask(),
	},
	"fal-ai": {
		// TODO: Add automatic-speech-recognition task helper
		// "automatic-speech-recognition": new FalAIAutomaticSpeechRecognitionTask(),
		"text-to-image": new FalAITextToImageTask(),
		"text-to-speech": new FalAITask("text-to-speech"),
		"text-to-video": new FalAITextToVideoTask(),
	},
	"fireworks-ai": {
		conversational: new FireworksConversationalTask(),
	},
	"hf-inference": {
		"text-to-image": new HFInferenceTask("text-to-image"),
		conversational: new HFInferenceConversationalTask(),
		"text-generation": new HFInferenceTask("text-generation"),
		"text-classification": new HFInferenceTask("text-classification"),
		"question-answering": new HFInferenceTask("question-answering"),
		"audio-classification": new HFInferenceBinaryInputTask("audio-classification"),
		"automatic-speech-recognition": new HFInferenceBinaryInputTask("automatic-speech-recognition"),
		"fill-mask": new HFInferenceTask("fill-mask"),
		"feature-extraction": new HFInferenceTask("feature-extraction"),
		"image-classification": new HFInferenceBinaryInputTask("image-classification"),
		"image-segmentation": new HFInferenceBinaryInputTask("image-segmentation"),
		"document-question-answering": new HFInferenceTask("document-question-answering"),
		"image-to-text": new HFInferenceBinaryInputTask("image-to-text"),
		"object-detection": new HFInferenceBinaryInputTask("object-detection"),
		"audio-to-audio": new HFInferenceBinaryInputTask("audio-to-audio"),
		"zero-shot-image-classification": new HFInferenceBinaryInputTask("zero-shot-image-classification"),
		"zero-shot-classification": new HFInferenceTask("zero-shot-classification"),
		"image-to-image": new HFInferenceBinaryInputTask("image-to-image"),
		"sentence-similarity": new HFInferenceTask("sentence-similarity"),
		"table-question-answering": new HFInferenceTask("table-question-answering"),
		"tabular-classification": new HFInferenceTask("tabular-classification"),
		"text-to-speech": new HFInferenceTask("text-to-speech"),
		"token-classification": new HFInferenceTask("token-classification"),
		translation: new HFInferenceTask("translation"),
		summarization: new HFInferenceTask("summarization"),
		"visual-question-answering": new HFInferenceBinaryInputTask("visual-question-answering"),
	},
	hyperbolic: {
		"text-to-image": new HyperbolicTextToImageTask(),
		conversational: new HyperbolicConversationalTask(),
		"text-generation": new HyperbolicTextGenerationTask(),
	},
	nebius: {
		"text-to-image": new NebiusTextToImageTask(),
		conversational: new NebiusConversationalTask(),
		"text-generation": new NebiusTextGenerationTask(),
	},
	novita: {
		"text-generation": new NovitaTextGenerationTask(),
		conversational: new NovitaConversationalTask(),
	},
	openai: {
		conversational: new OpenAIConversationalTask(),
	},
	replicate: {
		"text-to-image": new ReplicateTextToImageTask(),
		"text-to-speech": new ReplicateTextToSpeechTask(),
		"text-to-video": new ReplicateTextToVideoTask(),
	},
	sambanova: {
		conversational: new SambanovaConversationalTask(),
	},
	together: {
		"text-to-image": new TogetherTextToImageTask(),
		"text-generation": new TogetherTextGenerationTask(),
		conversational: new TogetherConversationalTask(),
	},
};

/**
 * Get provider helper instance by name and task
 */
export function getProviderHelper(provider: InferenceProvider, task: InferenceTask | undefined): TaskProviderHelper {
	if (!task) {
		throw new Error("you need to provide a task name, e.g. 'text-to-image'");
	}
	if (!(provider in PROVIDERS)) {
		throw new Error(`Provider '${provider}' not supported. Available providers: ${Object.keys(PROVIDERS)}`);
	}
	const providerTasks = PROVIDERS[provider];
	if (!providerTasks || !(task in providerTasks)) {
		throw new Error(
			`Task '${task}' not supported for provider '${provider}'. Available tasks: ${Object.keys(providerTasks ?? {})}`
		);
	}
	return providerTasks[task] as TaskProviderHelper;
}
