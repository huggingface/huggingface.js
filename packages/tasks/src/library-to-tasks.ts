import type { ModelLibraryKey } from "./model-libraries.js";
import type { PipelineType } from "./pipelines.js";

/**
 * Mapping from library name to its supported tasks.
 * Inference API (serverless) should be disabled for all other (library, task) pairs beyond this mapping.
 * This mapping is partially generated automatically by "python-api-export-tasks" action in
 * huggingface/api-inference-community repo upon merge. For transformers, the mapping is manually
 * based on api-inference (hf_types.rs).
 */
export const LIBRARY_TASK_MAPPING: Partial<Record<ModelLibraryKey, PipelineType[]>> = {
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
	paddlenlp: ["fill-mask", "summarization", "zero-shot-classification"],
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
	transformers: [
		"audio-classification",
		"automatic-speech-recognition",
		"depth-estimation",
		"document-question-answering",
		"feature-extraction",
		"fill-mask",
		"image-classification",
		"image-segmentation",
		"image-to-image",
		"image-to-text",
		"image-text-to-text",
		"object-detection",
		"question-answering",
		"summarization",
		"table-question-answering",
		"text2text-generation",
		"text-classification",
		"text-generation",
		"text-to-audio",
		"text-to-speech",
		"token-classification",
		"translation",
		"video-classification",
		"visual-question-answering",
		"zero-shot-classification",
		"zero-shot-image-classification",
		"zero-shot-object-detection",
	],
	mindspore: ["image-classification"],
};
