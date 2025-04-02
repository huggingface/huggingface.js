import { BlackForestLabsTextToImageTask } from "../providers/black-forest-labs";
import { CerebrasConversationalTask } from "../providers/cerebras";
import { CohereConversationalTask } from "../providers/cohere";
import {
	FalAIAutomaticSpeechRecognitionTask,
	FalAITextToImageTask,
	FalAITextToSpeechTask,
	FalAITextToVideoTask,
} from "../providers/fal-ai";
import { FireworksConversationalTask } from "../providers/fireworks-ai";
import {
	HFInferenceConversationalTask,
	HFInferenceTask,
	HFInferenceTextGenerationTask,
	HFInferenceTextToImageTask,
} from "../providers/hf-inference";
import {
	HyperbolicConversationalTask,
	HyperbolicTextGenerationTask,
	HyperbolicTextToImageTask,
} from "../providers/hyperbolic";
import { NebiusConversationalTask, NebiusTextGenerationTask, NebiusTextToImageTask } from "../providers/nebius";
import { NovitaConversationalTask, NovitaTextGenerationTask } from "../providers/novita";
import { OpenAIConversationalTask } from "../providers/openai";
import type { TaskProviderHelper, TextGenerationTaskHelper, TextToImageTaskHelper } from "../providers/providerHelper";
import { ReplicateTextToImageTask, ReplicateTextToSpeechTask, ReplicateTextToVideoTask } from "../providers/replicate";
import { SambanovaConversationalTask } from "../providers/sambanova";
import { TogetherConversationalTask, TogetherTextGenerationTask, TogetherTextToImageTask } from "../providers/together";
import type { InferenceProvider, InferenceTask } from "../types";
import { typedIn } from "../utils/typedIn";
import { typedInclude } from "../utils/typedInclude";
import { typedKeys } from "../utils/typedKeys";

export const HELPERS = {
	"text-to-image": {
		"black-forest-labs": new BlackForestLabsTextToImageTask(),
		"fal-ai": new FalAITextToImageTask(),
		"hf-inference": new HFInferenceTextToImageTask(),
		hyperbolic: new HyperbolicTextToImageTask(),
		nebius: new NebiusTextToImageTask(),
		together: new TogetherTextToImageTask(),
	} satisfies Partial<Record<InferenceProvider, TextToImageTaskHelper>>,
	// "text-to-speech": {
	// 	"fal-ai": new FalAITextToSpeechTask(),
	// 	"hf-inference": new HFInferenceTask("text-to-speech"),
	// 	replicate: new ReplicateTextToSpeechTask(),
	// } satisfies Partial<Record<InferenceProvider, TextToSpeechTaskHelper>>,
	// "text-to-video": {
	// 	"fal-ai": new FalAITextToVideoTask(),
	// 	replicate: new ReplicateTextToVideoTask(),
	// } satisfies Partial<Record<InferenceProvider, TextToVideoTaskHelper>>,
	// "automatic-speech-recognition": {
	// 	"fal-ai": new FalAIAutomaticSpeechRecognitionTask(),
	// 	"hf-inference": new HFInferenceTask("automatic-speech-recognition"),
	// } satisfies Partial<Record<InferenceProvider, AutomaticSpeechRecognitionTaskHelper>>,
	// "text-generation": {
	// 	"hf-inference": new HFInferenceTextGenerationTask(),
	// 	"hyperbolic": new HyperbolicTextGenerationTask(),
	// 	nebius: new NebiusTextGenerationTask(),
	// 	"novita": new NovitaTextGenerationTask(),
	// 	"together": new TogetherTextGenerationTask(),
	// } satisfies Partial<Record<InferenceProvider, TextGenerationTaskHelper>>,
	// "conversational": {
	// 	cerebras: new CerebrasConversationalTask(),
	// 	cohere: new CohereConversationalTask(),
	// 	"fireworks-ai": new FireworksConversationalTask(),
	// 	"hf-inference": new HFInferenceConversationalTask(),
	// 	hyperbolic: new HyperbolicConversationalTask(),
	// 	nebius: new NebiusConversationalTask(),
	// 	novita: new NovitaConversationalTask(),
	// 	openai: new OpenAIConversationalTask(),
	// 	replicate: new ReplicateTextToImageTask(),
	// 	sambanova: new SambanovaConversationalTask(),
	// 	together: new TogetherConversationalTask(),
	// } satisfies Partial<Record<InferenceProvider, ConversationalTaskHelper>>,
} satisfies Partial<Record<InferenceTask, Partial<Record<InferenceProvider, TaskProviderHelper>>>>;

export const SUPPORTED_TASKS = typedKeys(HELPERS);
/**
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
		"automatic-speech-recognition": new FalAIAutomaticSpeechRecognitionTask(),
		"text-to-image": new FalAITextToImageTask(),
		"text-to-speech": new FalAITextToSpeechTask(),
		"text-to-video": new FalAITextToVideoTask(),
	},
	"fireworks-ai": {
		conversational: new FireworksConversationalTask(),
	},
	"hf-inference": {
		"text-to-image": new HFInferenceTextToImageTask(),
		conversational: new HFInferenceConversationalTask(),
		"text-generation": new HFInferenceTextGenerationTask(),
		"text-classification": new HFInferenceTask("text-classification"),
		"text-to-audio": new HFInferenceTask("text-to-audio"),
		"question-answering": new HFInferenceTask("question-answering"),
		"audio-classification": new HFInferenceTask("audio-classification"),
		"automatic-speech-recognition": new HFInferenceTask("automatic-speech-recognition"),
		"fill-mask": new HFInferenceTask("fill-mask"),
		"feature-extraction": new HFInferenceTask("feature-extraction"),
		"image-classification": new HFInferenceTask("image-classification"),
		"image-segmentation": new HFInferenceTask("image-segmentation"),
		"document-question-answering": new HFInferenceTask("document-question-answering"),
		"image-to-text": new HFInferenceTask("image-to-text"),
		"object-detection": new HFInferenceTask("object-detection"),
		"audio-to-audio": new HFInferenceTask("audio-to-audio"),
		"zero-shot-image-classification": new HFInferenceTask("zero-shot-image-classification"),
		"zero-shot-classification": new HFInferenceTask("zero-shot-classification"),
		"image-to-image": new HFInferenceTask("image-to-image"),
		"sentence-similarity": new HFInferenceTask("sentence-similarity"),
		"table-question-answering": new HFInferenceTask("table-question-answering"),
		"tabular-classification": new HFInferenceTask("tabular-classification"),
		"text-to-speech": new HFInferenceTask("text-to-speech"),
		"token-classification": new HFInferenceTask("token-classification"),
		translation: new HFInferenceTask("translation"),
		summarization: new HFInferenceTask("summarization"),
		"visual-question-answering": new HFInferenceTask("visual-question-answering"),
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
} 
 */

/**
 * Get provider helper instance by name and task
 */
export function getProviderHelper(provider: InferenceProvider, task: "text-to-image"): TextToImageTaskHelper & TaskProviderHelper;
export function getProviderHelper(provider: InferenceProvider, task: InferenceTask | undefined): TaskProviderHelper {
	// special case for hf-inference, where the task is optional
	if (provider === "hf-inference") {
		if (!task) {
			return new HFInferenceTask();
		}
	}
	if (!task) {
		throw new Error("you need to provide a task name when using an external provider, e.g. 'text-to-image'");
	}
	if (!typedInclude(SUPPORTED_TASKS, task)) {
		throw new Error(`Task '${task}' not supported. Available tasks: ${Object.keys(HELPERS)}`);
	}
	switch (task) {
		case "text-to-image": {
			if (!typedIn(HELPERS["text-to-image"], provider)) {
				throw new Error(
					`Provider '${provider}' not supported for task '${task}'. Available providers: ${Object.keys(HELPERS["text-to-image"] ?? {})}`
				);
			}
			return HELPERS["text-to-image"][provider];
		}
	}
}
