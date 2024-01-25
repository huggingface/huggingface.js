import type { ModelLibraryKey } from "./model-libraries";
import type { PipelineType } from "./pipelines";

/**
 * Mapping from library name (excluding Transformers) to its supported tasks.
 * Serverless Inference Endpoints should be disabled for all other (library, task) pairs beyond this mapping.
 * As an exception, we assume Transformers supports all inference tasks.
 * This mapping is generated automatically by "python-api-export-tasks" action in huggingface/api-inference-community repo upon merge.
 * Ref: https://github.com/huggingface/api-inference-community/pull/158
 */
export const LIBRARY_TASK_MAPPING_EXCLUDING_TRANSFORMERS: Partial<Record<ModelLibraryKey, PipelineType[]>> = {
	"adapter-transformers": ["question-answering", "text-classification", "token-classification"],
	allennlp: ["question-answering"],
	asteroid: [
		// "audio-source-separation",
		"audio-to-audio",
	],
	bertopic: ["text-classification"],
	diffusers: ["image-to-image", "text-to-image"],
	doctr: ["object-detection"],
	espnet: ["text-to-speech", "automatic-speech-recognition"],
	fairseq: ["text-to-speech", "audio-to-audio"],
	fastai: ["image-classification"],
	fasttext: ["feature-extraction", "text-classification"],
	flair: ["token-classification"],
	k2: ["automatic-speech-recognition"],
	keras: ["image-classification"],
	nemo: ["automatic-speech-recognition"],
	open_clip: ["zero-shot-classification", "zero-shot-image-classification"],
	paddlenlp: ["conversational", "fill-mask", "summarization", "zero-shot-classification"],
	peft: ["text-generation"],
	"pyannote-audio": ["automatic-speech-recognition"],
	"sentence-transformers": ["feature-extraction", "sentence-similarity"],
	setfit: ["text-classification"],
	sklearn: ["tabular-classification", "tabular-regression", "text-classification"],
	spacy: ["token-classification", "text-classification", "sentence-similarity"],
	"span-marker": ["token-classification"],
	speechbrain: [
		"audio-classification",
		"audio-to-audio",
		"automatic-speech-recognition",
		"text-to-speech",
		"text2text-generation",
	],
	stanza: ["token-classification"],
	timm: ["image-classification"],
	mindspore: ["image-classification"],
};
