// Custom tasks with arbitrary inputs and outputs
export * from "./custom/request";
export * from "./custom/streamingRequest";

// Audio tasks
export * from "./audio/audioClassification";
export * from "./audio/audioToAudio";
export * from "./audio/automaticSpeechRecognition";
export * from "./audio/textToSpeech";

// Computer Vision tasks
export * from "./cv/imageClassification";
export * from "./cv/imageSegmentation";
export * from "./cv/imageToImage";
export * from "./cv/imageToText";
export * from "./cv/objectDetection";
export * from "./cv/textToImage";
export * from "./cv/textToVideo";
export * from "./cv/zeroShotImageClassification";

// Natural Language Processing tasks
export * from "./nlp/chatCompletion";
export * from "./nlp/chatCompletionStream";
export * from "./nlp/featureExtraction";
export * from "./nlp/fillMask";
export * from "./nlp/questionAnswering";
export * from "./nlp/sentenceSimilarity";
export * from "./nlp/summarization";
export * from "./nlp/tableQuestionAnswering";
export * from "./nlp/textClassification";
export * from "./nlp/textGeneration";
export * from "./nlp/textGenerationStream";
export * from "./nlp/tokenClassification";
export * from "./nlp/translation";
export * from "./nlp/zeroShotClassification";

// Multimodal tasks
export * from "./multimodal/documentQuestionAnswering";
export * from "./multimodal/visualQuestionAnswering";

// Tabular tasks
export * from "./tabular/tabularClassification";
export * from "./tabular/tabularRegression";

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
	HFInferenceAudioClassificationTask,
	HFInferenceAutomaticSpeechRecognitionTask,
	HFInferenceConversationalTask,
	HFInferenceDocumentQuestionAnsweringTask,
	HFInferenceFeatureExtractionTask,
	HFInferenceFillMaskTask,
	HFInferenceImageClassificationTask,
	HFInferenceImageSegmentationTask,
	HFInferenceImageToImageTask,
	HFInferenceImageToTextTask,
	HFInferenceObjectDetectionTask,
	HFInferenceQuestionAnsweringTask,
	HFInferenceSentenceSimilarityTask,
	HFInferenceSummarizationTask,
	HFInferenceTableQuestionAnsweringTask,
	HFInferenceTabularClassificationTask,
	HFInferenceTask,
	HFInferenceTextClassificationTask,
	HFInferenceTextGenerationTask,
	HFInferenceTextToImageTask,
	HFInferenceTextToSpeechTask,
	HFInferenceTokenClassificationTask,
	HFInferenceTranslationTask,
	HFInferenceVisualQuestionAnsweringTask,
	HFInferenceZeroShotClassificationTask,
	HFInferenceZeroShotImageClassificationTask,
} from "../providers/hf-inference";
import {
	HyperbolicConversationalTask,
	HyperbolicTextGenerationTask,
	HyperbolicTextToImageTask,
} from "../providers/hyperbolic";
import { NebiusConversationalTask, NebiusTextGenerationTask, NebiusTextToImageTask } from "../providers/nebius";
import { NovitaConversationalTask, NovitaTextGenerationTask } from "../providers/novita";
import { OpenAIConversationalTask } from "../providers/openai";
import type {
	AudioClassificationTaskHelper,
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
	TaskProviderHelper,
	TextClassificationTaskHelper,
	TextGenerationTaskHelper,
	TextToImageTaskHelper,
	TextToSpeechTaskHelper,
	TextToVideoTaskHelper,
	TokenClassificationTaskHelper,
	TranslationTaskHelper,
	VisualQuestionAnsweringTaskHelper,
	ZeroShotClassificationTaskHelper,
	ZeroShotImageClassificationTaskHelper,
} from "../providers/providerHelper";
import { ReplicateTextToImageTask, ReplicateTextToSpeechTask, ReplicateTextToVideoTask } from "../providers/replicate";
import { SambanovaConversationalTask } from "../providers/sambanova";
import { TogetherConversationalTask, TogetherTextGenerationTask, TogetherTextToImageTask } from "../providers/together";
import type { InferenceProvider, InferenceTask } from "../types";
import { typedIn } from "../utils/typedIn";
import { typedInclude } from "../utils/typedInclude";
import { typedKeys } from "../utils/typedKeys";

// Helper type to make sure all tasks implement both their specific helper interface and TaskProviderHelper
type TaskHelper<T> = T & TaskProviderHelper;

export const HELPERS = {
	"text-to-image": {
		"black-forest-labs": new BlackForestLabsTextToImageTask() as TaskHelper<TextToImageTaskHelper>,
		"fal-ai": new FalAITextToImageTask() as TaskHelper<TextToImageTaskHelper>,
		"hf-inference": new HFInferenceTextToImageTask() as TaskHelper<TextToImageTaskHelper>,
		hyperbolic: new HyperbolicTextToImageTask() as TaskHelper<TextToImageTaskHelper>,
		nebius: new NebiusTextToImageTask() as TaskHelper<TextToImageTaskHelper>,
		replicate: new ReplicateTextToImageTask() as TaskHelper<TextToImageTaskHelper>,
		together: new TogetherTextToImageTask() as TaskHelper<TextToImageTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<TextToImageTaskHelper>>>,

	"text-to-speech": {
		"fal-ai": new FalAITextToSpeechTask() as TaskHelper<TextToSpeechTaskHelper>,
		"hf-inference": new HFInferenceTextToSpeechTask() as TaskHelper<TextToSpeechTaskHelper>,
		replicate: new ReplicateTextToSpeechTask() as TaskHelper<TextToSpeechTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<TextToSpeechTaskHelper>>>,

	"text-to-video": {
		"fal-ai": new FalAITextToVideoTask() as TaskHelper<TextToVideoTaskHelper>,
		replicate: new ReplicateTextToVideoTask() as TaskHelper<TextToVideoTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<TextToVideoTaskHelper>>>,

	"automatic-speech-recognition": {
		"fal-ai": new FalAIAutomaticSpeechRecognitionTask() as TaskHelper<AutomaticSpeechRecognitionTaskHelper>,
		"hf-inference": new HFInferenceAutomaticSpeechRecognitionTask() as TaskHelper<AutomaticSpeechRecognitionTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<AutomaticSpeechRecognitionTaskHelper>>>,

	"text-generation": {
		"hf-inference": new HFInferenceTextGenerationTask() as TaskHelper<TextGenerationTaskHelper>,
		hyperbolic: new HyperbolicTextGenerationTask() as TaskHelper<TextGenerationTaskHelper>,
		nebius: new NebiusTextGenerationTask() as TaskHelper<TextGenerationTaskHelper>,
		novita: new NovitaTextGenerationTask() as TaskHelper<TextGenerationTaskHelper>,
		together: new TogetherTextGenerationTask() as TaskHelper<TextGenerationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<TextGenerationTaskHelper>>>,

	conversational: {
		cerebras: new CerebrasConversationalTask() as TaskHelper<ConversationalTaskHelper>,
		cohere: new CohereConversationalTask() as TaskHelper<ConversationalTaskHelper>,
		"fireworks-ai": new FireworksConversationalTask() as TaskHelper<ConversationalTaskHelper>,
		"hf-inference": new HFInferenceConversationalTask() as TaskHelper<ConversationalTaskHelper>,
		hyperbolic: new HyperbolicConversationalTask() as TaskHelper<ConversationalTaskHelper>,
		nebius: new NebiusConversationalTask() as TaskHelper<ConversationalTaskHelper>,
		novita: new NovitaConversationalTask() as TaskHelper<ConversationalTaskHelper>,
		openai: new OpenAIConversationalTask() as TaskHelper<ConversationalTaskHelper>,
		sambanova: new SambanovaConversationalTask() as TaskHelper<ConversationalTaskHelper>,
		together: new TogetherConversationalTask() as TaskHelper<ConversationalTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<ConversationalTaskHelper>>>,

	"text-classification": {
		"hf-inference": new HFInferenceTextClassificationTask() as TaskHelper<TextClassificationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<TextClassificationTaskHelper>>>,

	"question-answering": {
		"hf-inference": new HFInferenceQuestionAnsweringTask() as TaskHelper<QuestionAnsweringTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<QuestionAnsweringTaskHelper>>>,

	"audio-classification": {
		"hf-inference": new HFInferenceAudioClassificationTask() as TaskHelper<AudioClassificationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<AudioClassificationTaskHelper>>>,

	"fill-mask": {
		"hf-inference": new HFInferenceFillMaskTask() as TaskHelper<FillMaskTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<FillMaskTaskHelper>>>,

	"feature-extraction": {
		"hf-inference": new HFInferenceFeatureExtractionTask() as TaskHelper<FeatureExtractionTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<FeatureExtractionTaskHelper>>>,

	"image-classification": {
		"hf-inference": new HFInferenceImageClassificationTask() as TaskHelper<ImageClassificationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<ImageClassificationTaskHelper>>>,

	"image-segmentation": {
		"hf-inference": new HFInferenceImageSegmentationTask() as TaskHelper<ImageSegmentationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<ImageSegmentationTaskHelper>>>,

	"document-question-answering": {
		"hf-inference": new HFInferenceDocumentQuestionAnsweringTask() as TaskHelper<DocumentQuestionAnsweringTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<DocumentQuestionAnsweringTaskHelper>>>,

	"image-to-text": {
		"hf-inference": new HFInferenceImageToTextTask() as TaskHelper<ImageToTextTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<ImageToTextTaskHelper>>>,

	"object-detection": {
		"hf-inference": new HFInferenceObjectDetectionTask() as TaskHelper<ObjectDetectionTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<ObjectDetectionTaskHelper>>>,

	"zero-shot-image-classification": {
		"hf-inference":
			new HFInferenceZeroShotImageClassificationTask() as TaskHelper<ZeroShotImageClassificationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<ZeroShotImageClassificationTaskHelper>>>,

	"zero-shot-classification": {
		"hf-inference": new HFInferenceZeroShotClassificationTask() as TaskHelper<ZeroShotClassificationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<ZeroShotClassificationTaskHelper>>>,

	"image-to-image": {
		"hf-inference": new HFInferenceImageToImageTask() as TaskHelper<ImageToImageTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<ImageToImageTaskHelper>>>,

	"sentence-similarity": {
		"hf-inference": new HFInferenceSentenceSimilarityTask() as TaskHelper<SentenceSimilarityTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<SentenceSimilarityTaskHelper>>>,

	"table-question-answering": {
		"hf-inference": new HFInferenceTableQuestionAnsweringTask() as TaskHelper<TableQuestionAnsweringTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<TableQuestionAnsweringTaskHelper>>>,

	"tabular-classification": {
		"hf-inference": new HFInferenceTabularClassificationTask() as TaskHelper<TabularClassificationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<TabularClassificationTaskHelper>>>,

	"token-classification": {
		"hf-inference": new HFInferenceTokenClassificationTask() as TaskHelper<TokenClassificationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<TokenClassificationTaskHelper>>>,

	translation: {
		"hf-inference": new HFInferenceTranslationTask() as TaskHelper<TranslationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<TranslationTaskHelper>>>,

	summarization: {
		"hf-inference": new HFInferenceSummarizationTask() as TaskHelper<SummarizationTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<SummarizationTaskHelper>>>,

	"visual-question-answering": {
		"hf-inference": new HFInferenceVisualQuestionAnsweringTask() as TaskHelper<VisualQuestionAnsweringTaskHelper>,
	} satisfies Partial<Record<InferenceProvider, TaskHelper<VisualQuestionAnsweringTaskHelper>>>,
} satisfies Partial<Record<InferenceTask, Partial<Record<InferenceProvider, TaskProviderHelper>>>>;

export const SUPPORTED_TASKS = typedKeys(HELPERS);

/**
 * Get provider helper instance by name and task
 */
export function getProviderHelper(
	provider: InferenceProvider,
	task: "text-to-image"
): TextToImageTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "text-to-speech"
): TextToSpeechTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "text-to-video"
): TextToVideoTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "automatic-speech-recognition"
): AutomaticSpeechRecognitionTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "text-generation"
): TextGenerationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "conversational"
): ConversationalTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "text-classification"
): TextClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "question-answering"
): QuestionAnsweringTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "audio-classification"
): AudioClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "fill-mask"
): FillMaskTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "feature-extraction"
): FeatureExtractionTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "image-classification"
): ImageClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "image-segmentation"
): ImageSegmentationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "document-question-answering"
): DocumentQuestionAnsweringTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "image-to-text"
): ImageToTextTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "object-detection"
): ObjectDetectionTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "zero-shot-image-classification"
): ZeroShotImageClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "zero-shot-classification"
): ZeroShotClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "image-to-image"
): ImageToImageTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "sentence-similarity"
): SentenceSimilarityTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "table-question-answering"
): TableQuestionAnsweringTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "tabular-classification"
): TabularClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "token-classification"
): TokenClassificationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "translation"
): TranslationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "summarization"
): SummarizationTaskHelper & TaskProviderHelper;
export function getProviderHelper(
	provider: InferenceProvider,
	task: "visual-question-answering"
): VisualQuestionAnsweringTaskHelper & TaskProviderHelper;
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

	// If the task exists, get the provider from the task
	const taskHelpers = HELPERS[task];
	if (!typedIn(taskHelpers, provider)) {
		throw new Error(
			`Provider '${provider}' not supported for task '${task}'. Available providers: ${Object.keys(taskHelpers)}`
		);
	}

	return taskHelpers[provider];
}
