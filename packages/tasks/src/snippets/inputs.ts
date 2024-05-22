import type { PipelineType } from "../pipelines";
import type { InputGenerator, ModelDataMinimal } from "./types";

import inputsTextGeneration from "./tasks/text-generation";
import inputsZeroShotClassification from "./tasks/zero-shot-classification";
import inputsTranslation from "./tasks/translation";
import inputsSummarization from "./tasks/summarization";
import inputsTableQuestionAnswering from "./tasks/table-question-answering";
import inputsVisualQuestionAnswering from "./tasks/visual-question-answering";
import inputsQuestionAnswering from "./tasks/question-answering";
import inputsTextClassification from "./tasks/text-classification";
import inputsTokenClassification from "./tasks/token-classification";
import inputsText2TextGeneration from "./tasks/text2text-generation";
import inputsFillMask from "./tasks/fill-mask";
import inputsSentenceSimilarity from "./tasks/sentence-similarity";
import inputsFeatureExtraction from "./tasks/feature-extraction";
import inputsImageClassification from "./tasks/image-classification";
import inputsImageToText from "./tasks/image-to-text";
import inputsImageSegmentation from "./tasks/image-segmentation";
import inputsObjectDetection from "./tasks/object-detection";
import inputsAudioToAudio from "./tasks/audio-to-audio";
import inputsAudioClassification from "./tasks/audio-classification";
import inputsTextToImage from "./tasks/text-to-image";
import inputsTextToSpeech from "./tasks/text-to-speech";
import inputsTextToAudio from "./tasks/text-to-audio";
import inputsAutomaticSpeechRecognition from "./tasks/automatic-speech-recognition";
import inputsTabularPrediction from "./tasks/tabular-prediction";
import inputsZeroShotImageClassification from "./tasks/zero-shot-image-classification";

const modelInputSnippets: {
	[key in PipelineType]?: InputGenerator;
} = {
	"audio-to-audio": inputsAudioToAudio,
	"audio-classification": inputsAudioClassification,
	"automatic-speech-recognition": inputsAutomaticSpeechRecognition,
	"document-question-answering": inputsVisualQuestionAnswering,
	"feature-extraction": inputsFeatureExtraction,
	"fill-mask": inputsFillMask,
	"image-classification": inputsImageClassification,
	"image-to-text": inputsImageToText,
	"image-segmentation": inputsImageSegmentation,
	"object-detection": inputsObjectDetection,
	"question-answering": inputsQuestionAnswering,
	"sentence-similarity": inputsSentenceSimilarity,
	summarization: inputsSummarization,
	"table-question-answering": inputsTableQuestionAnswering,
	"tabular-regression": inputsTabularPrediction,
	"tabular-classification": inputsTabularPrediction,
	"text-classification": inputsTextClassification,
	"text-generation": inputsTextGeneration,
	"text-to-image": inputsTextToImage,
	"text-to-speech": inputsTextToSpeech,
	"text-to-audio": inputsTextToAudio,
	"text2text-generation": inputsText2TextGeneration,
	"token-classification": inputsTokenClassification,
	translation: inputsTranslation,
	"zero-shot-classification": inputsZeroShotClassification,
	"zero-shot-image-classification": inputsZeroShotImageClassification,
};

// Use noWrap to put the whole snippet on a single line (removing new lines and tabulations)
// Use noQuotes to strip quotes from start & end (example: "abc" -> abc)
export function getModelInputSnippet(model: ModelDataMinimal, noWrap = false, noQuotes = false): string {
	if (model.pipeline_tag) {
		const inputs = modelInputSnippets[model.pipeline_tag];
		if (inputs) {
			let result = inputs(model);
			if (noWrap) {
				result = result.replace(/(?:(?:\r?\n|\r)\t*)|\t+/g, " ");
			}
			if (noQuotes) {
				const REGEX_QUOTES = /^"(.+)"$/s;
				const match = result.match(REGEX_QUOTES);
				result = match ? match[1] : result;
			}
			return result;
		}
	}
	return "No input example has been defined for this model task.";
}
