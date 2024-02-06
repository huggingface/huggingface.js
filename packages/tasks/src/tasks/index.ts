import { type PipelineType, PIPELINE_DATA } from "../pipelines";

import audioClassification from "./audio-classification/data";
import audioToAudio from "./audio-to-audio/data";
import automaticSpeechRecognition from "./automatic-speech-recognition/data";
import conversational from "./conversational/data";
import documentQuestionAnswering from "./document-question-answering/data";
import featureExtraction from "./feature-extraction/data";
import fillMask from "./fill-mask/data";
import imageClassification from "./image-classification/data";
import imageToImage from "./image-to-image/data";
import imageToText from "./image-to-text/data";
import imageSegmentation from "./image-segmentation/data";
import maskGeneration from "./mask-generation/data";
import objectDetection from "./object-detection/data";
import depthEstimation from "./depth-estimation/data";
import placeholder from "./placeholder/data";
import reinforcementLearning from "./reinforcement-learning/data";
import questionAnswering from "./question-answering/data";
import sentenceSimilarity from "./sentence-similarity/data";
import summarization from "./summarization/data";
import tableQuestionAnswering from "./table-question-answering/data";
import tabularClassification from "./tabular-classification/data";
import tabularRegression from "./tabular-regression/data";
import textToImage from "./text-to-image/data";
import textToSpeech from "./text-to-speech/data";
import tokenClassification from "./token-classification/data";
import translation from "./translation/data";
import textClassification from "./text-classification/data";
import textGeneration from "./text-generation/data";
import textToVideo from "./text-to-video/data";
import unconditionalImageGeneration from "./unconditional-image-generation/data";
import videoClassification from "./video-classification/data";
import visualQuestionAnswering from "./visual-question-answering/data";
import zeroShotClassification from "./zero-shot-classification/data";
import zeroShotImageClassification from "./zero-shot-image-classification/data";
import zeroShotObjectDetection from "./zero-shot-object-detection/data";

import type { ModelLibraryKey } from "../model-libraries";

/**
 * Model libraries compatible with each ML task
 */
export const TASKS_MODEL_LIBRARIES: Record<PipelineType, ModelLibraryKey[]> = {
	"audio-classification": ["speechbrain", "transformers", "transformers.js"],
	"audio-to-audio": ["asteroid", "speechbrain"],
	"automatic-speech-recognition": ["espnet", "nemo", "speechbrain", "transformers", "transformers.js"],
	conversational: ["transformers"],
	"depth-estimation": ["transformers", "transformers.js"],
	"document-question-answering": ["transformers", "transformers.js"],
	"feature-extraction": ["sentence-transformers", "transformers", "transformers.js"],
	"fill-mask": ["transformers", "transformers.js"],
	"graph-ml": ["transformers"],
	"image-classification": ["keras", "timm", "transformers", "transformers.js"],
	"image-feature-extraction": ["timm", "transformers"],
	"image-segmentation": ["transformers", "transformers.js"],
	"image-to-image": ["diffusers", "transformers", "transformers.js"],
	"image-to-text": ["transformers", "transformers.js"],
	"image-to-video": ["diffusers"],
	"video-classification": ["transformers"],
	"mask-generation": ["transformers"],
	"multiple-choice": ["transformers"],
	"object-detection": ["transformers", "transformers.js"],
	other: [],
	"question-answering": ["adapter-transformers", "allennlp", "transformers", "transformers.js"],
	robotics: [],
	"reinforcement-learning": ["transformers", "stable-baselines3", "ml-agents", "sample-factory"],
	"sentence-similarity": ["sentence-transformers", "spacy", "transformers.js"],
	summarization: ["transformers", "transformers.js"],
	"table-question-answering": ["transformers"],
	"table-to-text": ["transformers"],
	"tabular-classification": ["sklearn"],
	"tabular-regression": ["sklearn"],
	"tabular-to-text": ["transformers"],
	"text-classification": ["adapter-transformers", "setfit", "spacy", "transformers", "transformers.js"],
	"text-generation": ["transformers", "transformers.js"],
	"text-retrieval": [],
	"text-to-image": ["diffusers"],
	"text-to-speech": ["espnet", "tensorflowtts", "transformers", "transformers.js"],
	"text-to-audio": ["transformers", "transformers.js"],
	"text-to-video": ["diffusers"],
	"text2text-generation": ["transformers", "transformers.js"],
	"time-series-forecasting": [],
	"token-classification": [
		"adapter-transformers",
		"flair",
		"spacy",
		"span-marker",
		"stanza",
		"transformers",
		"transformers.js",
	],
	translation: ["transformers", "transformers.js"],
	"unconditional-image-generation": ["diffusers"],
	"visual-question-answering": ["transformers", "transformers.js"],
	"voice-activity-detection": [],
	"zero-shot-classification": ["transformers", "transformers.js"],
	"zero-shot-image-classification": ["transformers", "transformers.js"],
	"zero-shot-object-detection": ["transformers", "transformers.js"],
	"text-to-3d": [],
	"image-to-3d": [],
};

/**
 * Return the whole TaskData object for a certain task.
 * If the partialTaskData argument is left undefined,
 * the default placholder data will be used.
 */
function getData(type: PipelineType, partialTaskData: TaskDataCustom = placeholder): TaskData {
	return {
		...partialTaskData,
		id: type,
		label: PIPELINE_DATA[type].name,
		libraries: TASKS_MODEL_LIBRARIES[type],
	};
}

// To make comparisons easier, task order is the same as in const.ts
// Tasks set to undefined won't have an associated task page.
// Tasks that call getData() without the second argument will
// have a "placeholder" page.
export const TASKS_DATA: Record<PipelineType, TaskData | undefined> = {
	"audio-classification": getData("audio-classification", audioClassification),
	"audio-to-audio": getData("audio-to-audio", audioToAudio),
	"automatic-speech-recognition": getData("automatic-speech-recognition", automaticSpeechRecognition),
	conversational: getData("conversational", conversational),
	"depth-estimation": getData("depth-estimation", depthEstimation),
	"document-question-answering": getData("document-question-answering", documentQuestionAnswering),
	"feature-extraction": getData("feature-extraction", featureExtraction),
	"fill-mask": getData("fill-mask", fillMask),
	"graph-ml": undefined,
	"image-classification": getData("image-classification", imageClassification),
	"image-segmentation": getData("image-segmentation", imageSegmentation),
	"image-to-image": getData("image-to-image", imageToImage),
	"image-to-text": getData("image-to-text", imageToText),
	"image-to-video": undefined,
	"mask-generation": getData("mask-generation", maskGeneration),
	"multiple-choice": undefined,
	"object-detection": getData("object-detection", objectDetection),
	"video-classification": getData("video-classification", videoClassification),
	other: undefined,
	"question-answering": getData("question-answering", questionAnswering),
	"reinforcement-learning": getData("reinforcement-learning", reinforcementLearning),
	robotics: undefined,
	"sentence-similarity": getData("sentence-similarity", sentenceSimilarity),
	summarization: getData("summarization", summarization),
	"table-question-answering": getData("table-question-answering", tableQuestionAnswering),
	"table-to-text": undefined,
	"tabular-classification": getData("tabular-classification", tabularClassification),
	"tabular-regression": getData("tabular-regression", tabularRegression),
	"tabular-to-text": undefined,
	"text-classification": getData("text-classification", textClassification),
	"text-generation": getData("text-generation", textGeneration),
	"text-retrieval": undefined,
	"text-to-image": getData("text-to-image", textToImage),
	"text-to-speech": getData("text-to-speech", textToSpeech),
	"text-to-audio": undefined,
	"text-to-video": getData("text-to-video", textToVideo),
	"text2text-generation": undefined,
	"time-series-forecasting": undefined,
	"token-classification": getData("token-classification", tokenClassification),
	translation: getData("translation", translation),
	"unconditional-image-generation": getData("unconditional-image-generation", unconditionalImageGeneration),
	"visual-question-answering": getData("visual-question-answering", visualQuestionAnswering),
	"voice-activity-detection": undefined,
	"zero-shot-classification": getData("zero-shot-classification", zeroShotClassification),
	"zero-shot-image-classification": getData("zero-shot-image-classification", zeroShotImageClassification),
	"zero-shot-object-detection": getData("zero-shot-object-detection", zeroShotObjectDetection),
	"text-to-3d": getData("text-to-3d", placeholder),
	"image-to-3d": getData("image-to-3d", placeholder),
	"image-feature-extraction": getData("image-feature-extraction", placeholder),
} as const;

export interface ExampleRepo {
	description: string;
	id: string;
}

export type TaskDemoEntry =
	| {
			filename: string;
			type: "audio";
	  }
	| {
			data: Array<{
				label: string;
				score: number;
			}>;
			type: "chart";
	  }
	| {
			filename: string;
			type: "img";
	  }
	| {
			table: string[][];
			type: "tabular";
	  }
	| {
			content: string;
			label: string;
			type: "text";
	  }
	| {
			text: string;
			tokens: Array<{
				end: number;
				start: number;
				type: string;
			}>;
			type: "text-with-tokens";
	  };

export interface TaskDemo {
	inputs: TaskDemoEntry[];
	outputs: TaskDemoEntry[];
}

export interface TaskData {
	datasets: ExampleRepo[];
	demo: TaskDemo;
	id: PipelineType;
	canonicalId?: PipelineType;
	isPlaceholder?: boolean;
	label: string;
	libraries: ModelLibraryKey[];
	metrics: ExampleRepo[];
	models: ExampleRepo[];
	spaces: ExampleRepo[];
	summary: string;
	widgetModels: string[];
	youtubeId?: string;
}

export type TaskDataCustom = Omit<TaskData, "id" | "label" | "libraries">;
