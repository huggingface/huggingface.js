import * as snippets from "./model-libraries-snippets";
import type { ModelData } from "./model-data";

/**
 * Elements configurable by a model library.
 */
export interface LibraryUiElement {
	/**
	 * Pretty name of the library.
	 * displayed in tags, and on the main
	 * call-to-action button on the model page.
	 */
	prettyName: string;
	/**
	 * Repo name of the library's (usually on GitHub) code repo
	 */
	repoName: string;
	/**
	 * URL to library's (usually on GitHub) code repo
	 */
	repoUrl: string;
	/**
	 * URL to library's docs
	 */
	docsUrl?: string;
	/**
	 * Code snippet(s) displayed on model page
	 */
	snippets?: (model: ModelData) => string[];
	/**
	 * should we display this library in hf.co/models filter
	 * (only for popular libraries with > 100 models)
	 */
	filter?: boolean;
}

/**
 * Add your new library here.
 *
 * This is for modeling (= architectures) libraries, not for file formats (like ONNX, etc).
 * (unlike libraries, file formats live in an enum inside the internal codebase.)
 *
 * Doc on how to add a library to the Hub:
 *
 * https://huggingface.co/docs/hub/models-adding-libraries
 *
 * /!\ IMPORTANT
 *
 * The key you choose is the tag your models have in their library_name on the Hub.
 */

export const MODEL_LIBRARIES_UI_ELEMENTS = {
	"adapter-transformers": {
		prettyName: "Adapters",
		repoName: "adapters",
		repoUrl: "https://github.com/Adapter-Hub/adapters",
		docsUrl: "https://huggingface.co/docs/hub/adapters",
		snippets: snippets.adapters,
		filter: true,
	},
	allennlp: {
		prettyName: "AllenNLP",
		repoName: "AllenNLP",
		repoUrl: "https://github.com/allenai/allennlp",
		docsUrl: "https://huggingface.co/docs/hub/allennlp",
		snippets: snippets.allennlp,
		filter: true,
	},
	asteroid: {
		prettyName: "Asteroid",
		repoName: "Asteroid",
		repoUrl: "https://github.com/asteroid-team/asteroid",
		docsUrl: "https://huggingface.co/docs/hub/asteroid",
		snippets: snippets.asteroid,
		filter: true,
	},
	bertopic: {
		prettyName: "BERTopic",
		repoName: "BERTopic",
		repoUrl: "https://github.com/MaartenGr/BERTopic",
		snippets: snippets.bertopic,
		filter: true,
	},
	diffusers: {
		prettyName: "Diffusers",
		repoName: "🤗/diffusers",
		repoUrl: "https://github.com/huggingface/diffusers",
		docsUrl: "https://huggingface.co/docs/hub/diffusers",
		snippets: snippets.diffusers,
		filter: true,
	},
	doctr: {
		prettyName: "docTR",
		repoName: "doctr",
		repoUrl: "https://github.com/mindee/doctr",
	},
	espnet: {
		prettyName: "ESPnet",
		repoName: "ESPnet",
		repoUrl: "https://github.com/espnet/espnet",
		docsUrl: "https://huggingface.co/docs/hub/espnet",
		snippets: snippets.espnet,
		filter: true,
	},
	fairseq: {
		prettyName: "Fairseq",
		repoName: "fairseq",
		repoUrl: "https://github.com/pytorch/fairseq",
		snippets: snippets.fairseq,
		filter: true,
	},
	flair: {
		prettyName: "Flair",
		repoName: "Flair",
		repoUrl: "https://github.com/flairNLP/flair",
		docsUrl: "https://huggingface.co/docs/hub/flair",
		snippets: snippets.flair,
		filter: true,
	},
	keras: {
		prettyName: "Keras",
		repoName: "Keras",
		repoUrl: "https://github.com/keras-team/keras",
		docsUrl: "https://huggingface.co/docs/hub/keras",
		snippets: snippets.keras,
		filter: true,
	},
	k2: {
		prettyName: "K2",
		repoName: "k2",
		repoUrl: "https://github.com/k2-fsa/k2",
	},
	mlx: {
		prettyName: "MLX",
		repoName: "MLX",
		repoUrl: "https://github.com/ml-explore/mlx-examples/tree/main",
		snippets: snippets.mlx,
		filter: true,
	},
	nemo: {
		prettyName: "NeMo",
		repoName: "NeMo",
		repoUrl: "https://github.com/NVIDIA/NeMo",
		snippets: snippets.nemo,
		filter: true,
	},
	open_clip: {
		prettyName: "OpenCLIP",
		repoName: "OpenCLIP",
		repoUrl: "https://github.com/mlfoundations/open_clip",
		snippets: snippets.open_clip,
		filter: true,
	},
	paddlenlp: {
		prettyName: "paddlenlp",
		repoName: "PaddleNLP",
		repoUrl: "https://github.com/PaddlePaddle/PaddleNLP",
		docsUrl: "https://huggingface.co/docs/hub/paddlenlp",
		snippets: snippets.paddlenlp,
		filter: true,
	},
	peft: {
		prettyName: "PEFT",
		repoName: "PEFT",
		repoUrl: "https://github.com/huggingface/peft",
		snippets: snippets.peft,
		filter: true,
	},
	"pyannote-audio": {
		prettyName: "pyannote.audio",
		repoName: "pyannote-audio",
		repoUrl: "https://github.com/pyannote/pyannote-audio",
		snippets: snippets.pyannote_audio,
		filter: true,
	},
	"sentence-transformers": {
		prettyName: "sentence-transformers",
		repoName: "sentence-transformers",
		repoUrl: "https://github.com/UKPLab/sentence-transformers",
		docsUrl: "https://huggingface.co/docs/hub/sentence-transformers",
		snippets: snippets.sentenceTransformers,
		filter: true,
	},
	setfit: {
		prettyName: "setfit",
		repoName: "setfit",
		repoUrl: "https://github.com/huggingface/setfit",
		docsUrl: "https://huggingface.co/docs/hub/setfit",
		snippets: snippets.setfit,
		filter: true,
	},
	sklearn: {
		prettyName: "Scikit-learn",
		repoName: "Scikit-learn",
		repoUrl: "https://github.com/scikit-learn/scikit-learn",
		snippets: snippets.sklearn,
		filter: true,
	},
	fastai: {
		prettyName: "fastai",
		repoName: "fastai",
		repoUrl: "https://github.com/fastai/fastai",
		docsUrl: "https://huggingface.co/docs/hub/fastai",
		snippets: snippets.fastai,
		filter: true,
	},
	spacy: {
		prettyName: "spaCy",
		repoName: "spaCy",
		repoUrl: "https://github.com/explosion/spaCy",
		docsUrl: "https://huggingface.co/docs/hub/spacy",
		snippets: snippets.spacy,
		filter: true,
	},
	"span-marker": {
		prettyName: "SpanMarker",
		repoName: "SpanMarkerNER",
		repoUrl: "https://github.com/tomaarsen/SpanMarkerNER",
		docsUrl: "https://huggingface.co/docs/hub/span_marker",
		snippets: snippets.span_marker,
		filter: true,
	},
	speechbrain: {
		prettyName: "speechbrain",
		repoName: "speechbrain",
		repoUrl: "https://github.com/speechbrain/speechbrain",
		docsUrl: "https://huggingface.co/docs/hub/speechbrain",
		snippets: snippets.speechbrain,
		filter: true,
	},
	stanza: {
		prettyName: "Stanza",
		repoName: "stanza",
		repoUrl: "https://github.com/stanfordnlp/stanza",
		docsUrl: "https://huggingface.co/docs/hub/stanza",
		snippets: snippets.stanza,
		filter: true,
	},
	tensorflowtts: {
		prettyName: "TensorFlowTTS",
		repoName: "TensorFlowTTS",
		repoUrl: "https://github.com/TensorSpeech/TensorFlowTTS",
		snippets: snippets.tensorflowtts,
	},
	timm: {
		prettyName: "timm",
		repoName: "pytorch-image-models",
		repoUrl: "https://github.com/rwightman/pytorch-image-models",
		docsUrl: "https://huggingface.co/docs/hub/timm",
		snippets: snippets.timm,
		filter: true,
	},
	transformers: {
		prettyName: "Transformers",
		repoName: "🤗/transformers",
		repoUrl: "https://github.com/huggingface/transformers",
		docsUrl: "https://huggingface.co/docs/hub/transformers",
		snippets: snippets.transformers,
		filter: true,
	},
	"transformers.js": {
		prettyName: "Transformers.js",
		repoName: "transformers.js",
		repoUrl: "https://github.com/xenova/transformers.js",
		docsUrl: "https://huggingface.co/docs/hub/transformers-js",
		snippets: snippets.transformersJS,
		filter: true,
	},
	fasttext: {
		prettyName: "fastText",
		repoName: "fastText",
		repoUrl: "https://fasttext.cc/",
		snippets: snippets.fasttext,
		filter: true,
	},
	"sample-factory": {
		prettyName: "sample-factory",
		repoName: "sample-factory",
		repoUrl: "https://github.com/alex-petrenko/sample-factory",
		docsUrl: "https://huggingface.co/docs/hub/sample-factory",
		snippets: snippets.sampleFactory,
		filter: true,
	},
	"stable-baselines3": {
		prettyName: "stable-baselines3",
		repoName: "stable-baselines3",
		repoUrl: "https://github.com/huggingface/huggingface_sb3",
		docsUrl: "https://huggingface.co/docs/hub/stable-baselines3",
		snippets: snippets.stableBaselines3,
		filter: true,
	},
	mindspore: {
		prettyName: "MindSpore",
		repoName: "mindspore",
		repoUrl: "https://github.com/mindspore-ai/mindspore",
	},
	"ml-agents": {
		prettyName: "ml-agents",
		repoName: "ml-agents",
		repoUrl: "https://github.com/Unity-Technologies/ml-agents",
		docsUrl: "https://huggingface.co/docs/hub/ml-agents",
		snippets: snippets.mlAgents,
		filter: true,
	},
	"unity-sentis": {
		prettyName: "unity-sentis",
		repoName: "unity-sentis",
		repoUrl: "https://github.com/Unity-Technologies/sentis-samples",
		snippets: snippets.sentis,
		filter: true,
	},
	pythae: {
		prettyName: "pythae",
		repoName: "pythae",
		repoUrl: "https://github.com/clementchadebec/benchmark_VAE",
		snippets: snippets.pythae,
		filter: true,
	},
} satisfies Record<string, LibraryUiElement>;

export type ModelLibraryKey = keyof typeof MODEL_LIBRARIES_UI_ELEMENTS;

export const ALL_MODEL_LIBRARY_KEYS = Object.keys(MODEL_LIBRARIES_UI_ELEMENTS) as ModelLibraryKey[];

export const ALL_DISPLAY_MODEL_LIBRARY_KEYS = (
	Object.entries(MODEL_LIBRARIES_UI_ELEMENTS as Record<ModelLibraryKey, LibraryUiElement>) as [
		ModelLibraryKey,
		LibraryUiElement,
	][]
)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	.filter(([_, v]) => v.filter)
	.map(([k]) => k);
