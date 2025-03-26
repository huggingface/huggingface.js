import { BlackForestLabsTextToImageTask } from "../providers/black-forest-labs";
import { FalAITask, FalAITextToImageTask, FalAITextToVideoTask } from "../providers/fal-ai";
import { FireworksConversationalTask } from "../providers/fireworks-ai";
import {
	HyperbolicConversationalTask,
	HyperbolicTextGenerationTask,
	HyperbolicTextToImageTask,
} from "../providers/hyperbolic";
import { NebiusTextToImageTask } from "../providers/nebius";
import { NovitaConversationalTask, NovitaTextGenerationTask } from "../providers/novita";
import { OpenAIConversationalTask } from "../providers/openai";
import type { TaskProviderHelper } from "../providers/providerHelper";
import { BaseConversationalTask, BaseTextGenerationTask } from "../providers/providerHelper";
import { ReplicateTextToImageTask, ReplicateTextToSpeechTask, ReplicateTextToVideoTask } from "../providers/replicate";
import { TogetherConversationalTask, TogetherTextGenerationTask, TogetherTextToImageTask } from "../providers/together";
import type { InferenceProvider, InferenceTask } from "../types";

// ... existing code ...

export const PROVIDERS: Record<InferenceProvider, Partial<Record<InferenceTask, TaskProviderHelper>>> = {
	"black-forest-labs": {
		"text-to-image": new BlackForestLabsTextToImageTask(),
	},
	cerebras: {
		conversational: new BaseConversationalTask("cerebras", "https://api.cerebras.ai"),
	},
	cohere: {
		conversational: new BaseConversationalTask("cohere", "https://api.cohere.ai"),
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
		//TODO: Add the correct provider helpers for hf-inference
	},
	hyperbolic: {
		"text-to-image": new HyperbolicTextToImageTask(),
		conversational: new HyperbolicConversationalTask(),
		"text-generation": new HyperbolicTextGenerationTask(),
	},
	nebius: {
		"text-to-image": new NebiusTextToImageTask(),
		conversational: new BaseConversationalTask("nebius", "https://api.nebius.ai"),
		"text-generation": new BaseTextGenerationTask("nebius", "https://api.nebius.ai"),
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
		conversational: new BaseConversationalTask("sambanova", "https://api.sambanova.ai"),
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
	const helper = providerTasks[task];
	if (!helper) {
		throw new Error(`Internal error: Helper for task '${task}' and provider '${provider}' resolved to undefined.`);
	}
	return helper;
}
