import * as BlackForestLabs from "../providers/black-forest-labs.js";
import * as Cerebras from "../providers/cerebras.js";
import * as Cohere from "../providers/cohere.js";
import * as FalAI from "../providers/fal-ai.js";
import * as FeatherlessAI from "../providers/featherless-ai.js";
import * as Fireworks from "../providers/fireworks-ai.js";
import * as Groq from "../providers/groq.js";
import * as HFInference from "../providers/hf-inference.js";
import * as Hyperbolic from "../providers/hyperbolic.js";
import * as Nebius from "../providers/nebius.js";
import * as Novita from "../providers/novita.js";
import * as Nscale from "../providers/nscale.js";
import * as OpenAI from "../providers/openai.js";
import * as OvhCloud from "../providers/ovhcloud.js";
import type {
	AudioClassificationTaskHelper,
	AudioToAudioTaskHelper,
	AutomaticSpeechRecognitionTaskHelper,
	ConversationalTaskHelper,
	DocumentQuestionAnsweringTaskHelper,
	FeatureExtractionTaskHelper,
	FillMaskTaskHelper,
	ImageClassificationTaskHelper,
	ImageSegmentationTaskHelper,
	ImageToImageTaskHelper,
	ImageToTextTaskHelper,
	ObjectDetectionTaskHelper,
	QuestionAnsweringTaskHelper,
	SentenceSimilarityTaskHelper,
	SummarizationTaskHelper,
	TableQuestionAnsweringTaskHelper,
	TabularClassificationTaskHelper,
	TabularRegressionTaskHelper,
	TaskProviderHelper,
	TextClassificationTaskHelper,
	TextGenerationTaskHelper,
	TextToAudioTaskHelper,
	TextToImageTaskHelper,
	TextToSpeechTaskHelper,
	TextToVideoTaskHelper,
	TokenClassificationTaskHelper,
	TranslationTaskHelper,
	VisualQuestionAnsweringTaskHelper,
	ZeroShotClassificationTaskHelper,
	ZeroShotImageClassificationTaskHelper,
} from "../providers/providerHelper.js";
import * as Replicate from "../providers/replicate.js";
import * as Sambanova from "../providers/sambanova.js";
import * as Together from "../providers/together.js";
import type { InferenceProvider, InferenceProviderOrPolicy, InferenceTask } from "../types.js";

export const PROVIDERS: Record<InferenceProvider, Partial<Record<InferenceTask, TaskProviderHelper>>> = {
	"black-forest-labs": {
		"text-to-image": new BlackForestLabs.BlackForestLabsTextToImageTask(),
	},
	cerebras: {
		conversational: new Cerebras.CerebrasConversationalTask(),
	},
	cohere: {
		conversational: new Cohere.CohereConversationalTask(),
	},
	"fal-ai": {
		"text-to-image": new FalAI.FalAITextToImageTask(),
		"text-to-speech": new FalAI.FalAITextToSpeechTask(),
		"text-to-video": new FalAI.FalAITextToVideoTask(),
		"automatic-speech-recognition": new FalAI.FalAIAutomaticSpeechRecognitionTask(),
	},
	"featherless-ai": {
		conversational: new FeatherlessAI.FeatherlessAIConversationalTask(),
		"text-generation": new FeatherlessAI.FeatherlessAITextGenerationTask(),
	},
	"hf-inference": {
		"text-to-image": new HFInference.HFInferenceTextToImageTask(),
		conversational: new HFInference.HFInferenceConversationalTask(),
		"text-generation": new HFInference.HFInferenceTextGenerationTask(),
		"text-classification": new HFInference.HFInferenceTextClassificationTask(),
		"question-answering": new HFInference.HFInferenceQuestionAnsweringTask(),
		"audio-classification": new HFInference.HFInferenceAudioClassificationTask(),
		"automatic-speech-recognition": new HFInference.HFInferenceAutomaticSpeechRecognitionTask(),
		"fill-mask": new HFInference.HFInferenceFillMaskTask(),
		"feature-extraction": new HFInference.HFInferenceFeatureExtractionTask(),
		"image-classification": new HFInference.HFInferenceImageClassificationTask(),
		"image-segmentation": new HFInference.HFInferenceImageSegmentationTask(),
		"document-question-answering": new HFInference.HFInferenceDocumentQuestionAnsweringTask(),
		"image-to-text": new HFInference.HFInferenceImageToTextTask(),
		"object-detection": new HFInference.HFInferenceObjectDetectionTask(),
		"audio-to-audio": new HFInference.HFInferenceAudioToAudioTask(),
		"zero-shot-image-classification": new HFInference.HFInferenceZeroShotImageClassificationTask(),
		"zero-shot-classification": new HFInference.HFInferenceZeroShotClassificationTask(),
		"image-to-image": new HFInference.HFInferenceImageToImageTask(),
		"sentence-similarity": new HFInference.HFInferenceSentenceSimilarityTask(),
		"table-question-answering": new HFInference.HFInferenceTableQuestionAnsweringTask(),
		"tabular-classification": new HFInference.HFInferenceTabularClassificationTask(),
		"text-to-speech": new HFInference.HFInferenceTextToSpeechTask(),
		"token-classification": new HFInference.HFInferenceTokenClassificationTask(),
		translation: new HFInference.HFInferenceTranslationTask(),
		summarization: new HFInference.HFInferenceSummarizationTask(),
		"visual-question-answering": new HFInference.HFInferenceVisualQuestionAnsweringTask(),
		"tabular-regression": new HFInference.HFInferenceTabularRegressionTask(),
		"text-to-audio": new HFInference.HFInferenceTextToAudioTask(),
	},
	"fireworks-ai": {
		conversational: new Fireworks.FireworksConversationalTask(),
	},
	groq: {
		conversational: new Groq.GroqConversationalTask(),
		"text-generation": new Groq.GroqTextGenerationTask(),
	},
	hyperbolic: {
		"text-to-image": new Hyperbolic.HyperbolicTextToImageTask(),
		conversational: new Hyperbolic.HyperbolicConversationalTask(),
		"text-generation": new Hyperbolic.HyperbolicTextGenerationTask(),
	},
	nebius: {
		"text-to-image": new Nebius.NebiusTextToImageTask(),
		conversational: new Nebius.NebiusConversationalTask(),
		"text-generation": new Nebius.NebiusTextGenerationTask(),
		"feature-extraction": new Nebius.NebiusFeatureExtractionTask(),
	},
	novita: {
		conversational: new Novita.NovitaConversationalTask(),
		"text-generation": new Novita.NovitaTextGenerationTask(),
	},
	nscale: {
		"text-to-image": new Nscale.NscaleTextToImageTask(),
		conversational: new Nscale.NscaleConversationalTask(),
	},
	openai: {
		conversational: new OpenAI.OpenAIConversationalTask(),
	},
	ovhcloud: {
		conversational: new OvhCloud.OvhCloudConversationalTask(),
		"text-generation": new OvhCloud.OvhCloudTextGenerationTask(),
	},
	replicate: {
		"text-to-image": new Replicate.ReplicateTextToImageTask(),
		"text-to-speech": new Replicate.ReplicateTextToSpeechTask(),
		"text-to-video": new Replicate.ReplicateTextToVideoTask(),
	},
	sambanova: {
		conversational: new Sambanova.SambanovaConversationalTask(),
		"feature-extraction": new Sambanova.SambanovaFeatureExtractionTask(),
	},
	together: {
		"text-to-image": new Together.TogetherTextToImageTask(),
		conversational: new Together.TogetherConversationalTask(),
		"text-generation": new Together.TogetherTextGenerationTask(),
	},
};

/**
 * Get provider helper instance by name and task
 */
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "text-to-image"
): TextToImageTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "conversational"
): ConversationalTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "text-generation"
): TextGenerationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "text-to-speech"
): TextToSpeechTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "text-to-audio"
): TextToAudioTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "automatic-speech-recognition"
): AutomaticSpeechRecognitionTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "text-to-video"
): TextToVideoTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "text-classification"
): TextClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "question-answering"
): QuestionAnsweringTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "audio-classification"
): AudioClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "audio-to-audio"
): AudioToAudioTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "fill-mask"
): FillMaskTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "feature-extraction"
): FeatureExtractionTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "image-classification"
): ImageClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "image-segmentation"
): ImageSegmentationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "document-question-answering"
): DocumentQuestionAnsweringTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "image-to-text"
): ImageToTextTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "object-detection"
): ObjectDetectionTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "zero-shot-image-classification"
): ZeroShotImageClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "zero-shot-classification"
): ZeroShotClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "image-to-image"
): ImageToImageTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "sentence-similarity"
): SentenceSimilarityTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "table-question-answering"
): TableQuestionAnsweringTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "tabular-classification"
): TabularClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "tabular-regression"
): TabularRegressionTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "token-classification"
): TokenClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "translation"
): TranslationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "summarization"
): SummarizationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: "visual-question-answering"
): VisualQuestionAnsweringTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: InferenceTask | undefined
): TaskProviderHelper;

export function getProviderHelper(
	provider: InferenceProviderOrPolicy,
	task: InferenceTask | undefined
): TaskProviderHelper {
	if ((provider === "hf-inference" && !task) || provider === "auto") {
		return new HFInference.HFInferenceTask();
	}
	if (!task) {
		throw new Error("you need to provide a task name when using an external provider, e.g. 'text-to-image'");
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
