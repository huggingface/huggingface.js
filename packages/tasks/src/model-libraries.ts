import * as snippets from "./model-libraries-snippets";
import type { ModelData } from "./model-data";
import type { ElasticBoolQueryFilter } from "./model-libraries-downloads";

/**
 * Elements configurable by a model library.
 */
export interface LibraryUiElement {
	/**
	 * Pretty name of the library.
	 * displayed in tags, and on the main
	 * call-to-action button on the model page.
	 */
	prettyLabel: string;
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
	 * Elastic query used to count this library's model downloads
	 *
	 * By default, those files are counted:
	 * "config.json", "config.yaml", "hyperparams.yaml", "meta.yaml"
	 */
	countDownloads?: ElasticBoolQueryFilter;
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
		prettyLabel: "Adapters",
		repoName: "adapters",
		repoUrl: "https://github.com/Adapter-Hub/adapters",
		docsUrl: "https://huggingface.co/docs/hub/adapters",
		snippets: snippets.adapters,
		filter: true,
		countDownloads: {
			term: { path: "adapter_config.json" },
		},
	},
	allennlp: {
		prettyLabel: "AllenNLP",
		repoName: "AllenNLP",
		repoUrl: "https://github.com/allenai/allennlp",
		docsUrl: "https://huggingface.co/docs/hub/allennlp",
		snippets: snippets.allennlp,
		filter: true,
	},
	asteroid: {
		prettyLabel: "Asteroid",
		repoName: "Asteroid",
		repoUrl: "https://github.com/asteroid-team/asteroid",
		docsUrl: "https://huggingface.co/docs/hub/asteroid",
		snippets: snippets.asteroid,
		filter: true,
		countDownloads: {
			term: { path: "pytorch_model.bin" },
		},
	},
	audiocraft: {
		prettyLabel: "Audiocraft",
		repoName: "audiocraft",
		repoUrl: "https://github.com/facebookresearch/audiocraft",
		snippets: snippets.audiocraft,
		filter: false,
	},
	bertopic: {
		prettyLabel: "BERTopic",
		repoName: "BERTopic",
		repoUrl: "https://github.com/MaartenGr/BERTopic",
		snippets: snippets.bertopic,
		filter: true,
	},
	big_vision: {
		prettyLabel: "Big Vision",
		repoName: "big_vision",
		repoUrl: "https://github.com/google-research/big_vision",
		filter: false,
		countDownloads: {
			wildcard: { path: "*.npz" },
		},
	},
	chat_tts: {
		prettyLabel: "ChatTTS",
		repoName: "ChatTTS",
		repoUrl: "https://github.com/2noise/ChatTTS.git",
		filter: false,
		countDownloads: { term: { path: "asset/GPT.pt" } },
		snippets: snippets.chattts,
	},
	diffusers: {
		prettyLabel: "Diffusers",
		repoName: "🤗/diffusers",
		repoUrl: "https://github.com/huggingface/diffusers",
		docsUrl: "https://huggingface.co/docs/hub/diffusers",
		snippets: snippets.diffusers,
		filter: true,
		/// diffusers has its own more complex "countDownloads" query
	},
	doctr: {
		prettyLabel: "docTR",
		repoName: "doctr",
		repoUrl: "https://github.com/mindee/doctr",
	},
	elm: {
		prettyLabel: "ELM",
		repoName: "elm",
		repoUrl: "https://github.com/slicex-ai/elm",
		filter: false,
		countDownloads: {
			wildcard: { path: "*/slicex_elm_config.json" },
		},
	},
	espnet: {
		prettyLabel: "ESPnet",
		repoName: "ESPnet",
		repoUrl: "https://github.com/espnet/espnet",
		docsUrl: "https://huggingface.co/docs/hub/espnet",
		snippets: snippets.espnet,
		filter: true,
	},
	fairseq: {
		prettyLabel: "Fairseq",
		repoName: "fairseq",
		repoUrl: "https://github.com/pytorch/fairseq",
		snippets: snippets.fairseq,
		filter: true,
	},
	fastai: {
		prettyLabel: "fastai",
		repoName: "fastai",
		repoUrl: "https://github.com/fastai/fastai",
		docsUrl: "https://huggingface.co/docs/hub/fastai",
		snippets: snippets.fastai,
		filter: true,
	},
	fasttext: {
		prettyLabel: "fastText",
		repoName: "fastText",
		repoUrl: "https://fasttext.cc/",
		snippets: snippets.fasttext,
		filter: true,
		countDownloads: {
			wildcard: { path: "*.bin" },
		},
	},
	flair: {
		prettyLabel: "Flair",
		repoName: "Flair",
		repoUrl: "https://github.com/flairNLP/flair",
		docsUrl: "https://huggingface.co/docs/hub/flair",
		snippets: snippets.flair,
		filter: true,
		countDownloads: {
			term: { path: "pytorch_model.bin" },
		},
	},
	"gemma.cpp": {
		prettyLabel: "gemma.cpp",
		repoName: "gemma.cpp",
		repoUrl: "https://github.com/google/gemma.cpp",
		filter: false,
		countDownloads: { wildcard: { path: "*.sbs" } },
	},
	gliner: {
		prettyLabel: "GLiNER",
		repoName: "GLiNER",
		repoUrl: "https://github.com/urchade/GLiNER",
		snippets: snippets.gliner,
		filter: false,
		countDownloads: {
			term: { path: "gliner_config.json" },
		},
	},
	grok: {
		prettyLabel: "Grok",
		repoName: "Grok",
		repoUrl: "https://github.com/xai-org/grok-1",
		filter: false,
		countDownloads: {
			terms: { path: ["ckpt/tensor00000_000", "ckpt-0/tensor00000_000"] },
		},
	},
	keras: {
		prettyLabel: "Keras",
		repoName: "Keras",
		repoUrl: "https://github.com/keras-team/keras",
		docsUrl: "https://huggingface.co/docs/hub/keras",
		snippets: snippets.keras,
		filter: true,
		countDownloads: { term: { path: "saved_model.pb" } },
	},
	"keras-nlp": {
		prettyLabel: "KerasNLP",
		repoName: "KerasNLP",
		repoUrl: "https://keras.io/keras_nlp/",
		docsUrl: "https://github.com/keras-team/keras-nlp",
		snippets: snippets.keras_nlp,
	},
	k2: {
		prettyLabel: "K2",
		repoName: "k2",
		repoUrl: "https://github.com/k2-fsa/k2",
	},
	mindspore: {
		prettyLabel: "MindSpore",
		repoName: "mindspore",
		repoUrl: "https://github.com/mindspore-ai/mindspore",
	},
	"ml-agents": {
		prettyLabel: "ml-agents",
		repoName: "ml-agents",
		repoUrl: "https://github.com/Unity-Technologies/ml-agents",
		docsUrl: "https://huggingface.co/docs/hub/ml-agents",
		snippets: snippets.mlAgents,
		filter: true,
		countDownloads: { wildcard: { path: "*.onnx" } },
	},
	mlx: {
		prettyLabel: "MLX",
		repoName: "MLX",
		repoUrl: "https://github.com/ml-explore/mlx-examples/tree/main",
		snippets: snippets.mlx,
		filter: true,
	},
	"mlx-image": {
		prettyLabel: "mlx-image",
		repoName: "mlx-image",
		repoUrl: "https://github.com/riccardomusmeci/mlx-image",
		docsUrl: "https://huggingface.co/docs/hub/mlx-image",
		snippets: snippets.mlxim,
		filter: false,
		countDownloads: { term: { path: "model.safetensors" } },
	},
	nemo: {
		prettyLabel: "NeMo",
		repoName: "NeMo",
		repoUrl: "https://github.com/NVIDIA/NeMo",
		snippets: snippets.nemo,
		filter: true,
		countDownloads: { wildcard: { path: "*.nemo" } },
	},
	open_clip: {
		prettyLabel: "OpenCLIP",
		repoName: "OpenCLIP",
		repoUrl: "https://github.com/mlfoundations/open_clip",
		snippets: snippets.open_clip,
		filter: true,
		countDownloads: { wildcard: { path: "*pytorch_model.bin" } },
	},
	paddlenlp: {
		prettyLabel: "paddlenlp",
		repoName: "PaddleNLP",
		repoUrl: "https://github.com/PaddlePaddle/PaddleNLP",
		docsUrl: "https://huggingface.co/docs/hub/paddlenlp",
		snippets: snippets.paddlenlp,
		filter: true,
		countDownloads: {
			term: { path: "model_config.json" },
		},
	},
	peft: {
		prettyLabel: "PEFT",
		repoName: "PEFT",
		repoUrl: "https://github.com/huggingface/peft",
		snippets: snippets.peft,
		filter: true,
		countDownloads: {
			term: { path: "adapter_config.json" },
		},
	},
	"pyannote-audio": {
		prettyLabel: "pyannote.audio",
		repoName: "pyannote-audio",
		repoUrl: "https://github.com/pyannote/pyannote-audio",
		snippets: snippets.pyannote_audio,
		filter: true,
	},
	pythae: {
		prettyLabel: "pythae",
		repoName: "pythae",
		repoUrl: "https://github.com/clementchadebec/benchmark_VAE",
		snippets: snippets.pythae,
		filter: true,
	},
	recurrentgemma: {
		prettyLabel: "RecurrentGemma",
		repoName: "recurrentgemma",
		repoUrl: "https://github.com/google-deepmind/recurrentgemma",
		filter: false,
		countDownloads: { term: { path: "tokenizer.model" } },
	},
	"sample-factory": {
		prettyLabel: "sample-factory",
		repoName: "sample-factory",
		repoUrl: "https://github.com/alex-petrenko/sample-factory",
		docsUrl: "https://huggingface.co/docs/hub/sample-factory",
		snippets: snippets.sampleFactory,
		filter: true,
		countDownloads: { term: { path: "cfg.json" } },
	},
	"sentence-transformers": {
		prettyLabel: "sentence-transformers",
		repoName: "sentence-transformers",
		repoUrl: "https://github.com/UKPLab/sentence-transformers",
		docsUrl: "https://huggingface.co/docs/hub/sentence-transformers",
		snippets: snippets.sentenceTransformers,
		filter: true,
	},
	setfit: {
		prettyLabel: "setfit",
		repoName: "setfit",
		repoUrl: "https://github.com/huggingface/setfit",
		docsUrl: "https://huggingface.co/docs/hub/setfit",
		snippets: snippets.setfit,
		filter: true,
	},
	sklearn: {
		prettyLabel: "Scikit-learn",
		repoName: "Scikit-learn",
		repoUrl: "https://github.com/scikit-learn/scikit-learn",
		snippets: snippets.sklearn,
		filter: true,
		countDownloads: {
			term: { path: "sklearn_model.joblib" },
		},
	},
	spacy: {
		prettyLabel: "spaCy",
		repoName: "spaCy",
		repoUrl: "https://github.com/explosion/spaCy",
		docsUrl: "https://huggingface.co/docs/hub/spacy",
		snippets: snippets.spacy,
		filter: true,
		countDownloads: {
			wildcard: { path: "*.whl" },
		},
	},
	"span-marker": {
		prettyLabel: "SpanMarker",
		repoName: "SpanMarkerNER",
		repoUrl: "https://github.com/tomaarsen/SpanMarkerNER",
		docsUrl: "https://huggingface.co/docs/hub/span_marker",
		snippets: snippets.span_marker,
		filter: true,
	},
	speechbrain: {
		prettyLabel: "speechbrain",
		repoName: "speechbrain",
		repoUrl: "https://github.com/speechbrain/speechbrain",
		docsUrl: "https://huggingface.co/docs/hub/speechbrain",
		snippets: snippets.speechbrain,
		filter: true,
		countDownloads: {
			term: { path: "hyperparams.yaml" },
		},
	},
	"stable-audio-tools": {
		prettyLabel: "Stable Audio Tools",
		repoName: "stable-audio-tools",
		repoUrl: "https://github.com/Stability-AI/stable-audio-tools.git",
		filter: false,
		countDownloads: { term: { path: "model.safetensors" } },
		snippets: snippets.stable_audio_tools,
	},
	"diffusion-single-file": {
		prettyLabel: "Stable Diffusion 3",
		repoName: "stable-diffusion-3",
		repoUrl: "https://github.com/comfyanonymous/ComfyUI",
		filter: false,
		countDownloads: {
			wildcard: { path: "*.safetensors" },
		},
	},
	"stable-baselines3": {
		prettyLabel: "stable-baselines3",
		repoName: "stable-baselines3",
		repoUrl: "https://github.com/huggingface/huggingface_sb3",
		docsUrl: "https://huggingface.co/docs/hub/stable-baselines3",
		snippets: snippets.stableBaselines3,
		filter: true,
		countDownloads: {
			wildcard: { path: "*.zip" },
		},
	},
	stanza: {
		prettyLabel: "Stanza",
		repoName: "stanza",
		repoUrl: "https://github.com/stanfordnlp/stanza",
		docsUrl: "https://huggingface.co/docs/hub/stanza",
		snippets: snippets.stanza,
		filter: true,
		countDownloads: {
			term: { path: "models/default.zip" },
		},
	},
	tensorflowtts: {
		prettyLabel: "TensorFlowTTS",
		repoName: "TensorFlowTTS",
		repoUrl: "https://github.com/TensorSpeech/TensorFlowTTS",
		snippets: snippets.tensorflowtts,
	},
	"tic-clip": {
		prettyLabel: "TiC-CLIP",
		repoName: "TiC-CLIP",
		repoUrl: "https://github.com/apple/ml-tic-clip",
		filter: false,
		countDownloads: { wildcard: { path: "checkpoints/*.pt" } },
	},
	timesfm: {
		prettyLabel: "TimesFM",
		repoName: "timesfm",
		repoUrl: "https://github.com/google-research/timesfm",
		filter: false,
		countDownloads: {
			term: { path: "checkpoints/checkpoint_1100000/state/checkpoint" },
		},
	},
	timm: {
		prettyLabel: "timm",
		repoName: "pytorch-image-models",
		repoUrl: "https://github.com/rwightman/pytorch-image-models",
		docsUrl: "https://huggingface.co/docs/hub/timm",
		snippets: snippets.timm,
		filter: true,
		countDownloads: {
			terms: { path: ["pytorch_model.bin", "model.safetensors"] },
		},
	},
	transformers: {
		prettyLabel: "Transformers",
		repoName: "🤗/transformers",
		repoUrl: "https://github.com/huggingface/transformers",
		docsUrl: "https://huggingface.co/docs/hub/transformers",
		snippets: snippets.transformers,
		filter: true,
	},
	"transformers.js": {
		prettyLabel: "Transformers.js",
		repoName: "transformers.js",
		repoUrl: "https://github.com/xenova/transformers.js",
		docsUrl: "https://huggingface.co/docs/hub/transformers-js",
		snippets: snippets.transformersJS,
		filter: true,
	},
	"unity-sentis": {
		prettyLabel: "unity-sentis",
		repoName: "unity-sentis",
		repoUrl: "https://github.com/Unity-Technologies/sentis-samples",
		snippets: snippets.sentis,
		filter: true,
		countDownloads: {
			wildcard: { path: "*.sentis" },
		},
	},
	voicecraft: {
		prettyLabel: "VoiceCraft",
		repoName: "VoiceCraft",
		repoUrl: "https://github.com/jasonppy/VoiceCraft",
		docsUrl: "https://github.com/jasonppy/VoiceCraft",
		snippets: snippets.voicecraft,
	},
	whisperkit: {
		prettyLabel: "WhisperKit",
		repoName: "WhisperKit",
		repoUrl: "https://github.com/argmaxinc/WhisperKit",
		countDownloads: {
			wildcard: { path: "*/model.mil" },
		},
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
