/**
 * Add your new library here.
 *
 * This is for modeling (= architectures) libraries, not for file formats (like ONNX, etc).
 * File formats live in an enum inside the internal codebase.
 */
export enum ModelLibrary {
	"adapter-transformers" = "Adapter Transformers",
	"allennlp" = "allenNLP",
	"asteroid" = "Asteroid",
	"bertopic" = "BERTopic",
	"diffusers" = "Diffusers",
	"doctr" = "docTR",
	"espnet" = "ESPnet",
	"fairseq" = "Fairseq",
	"flair" = "Flair",
	"keras" = "Keras",
	"k2" = "K2",
	"mlx" = "MLX",
	"nemo" = "NeMo",
	"open_clip" = "OpenCLIP",
	"paddlenlp" = "PaddleNLP",
	"peft" = "PEFT",
	"pyannote-audio" = "pyannote.audio",
	"sample-factory" = "Sample Factory",
	"sentence-transformers" = "Sentence Transformers",
	"setfit" = "SetFit",
	"sklearn" = "Scikit-learn",
	"spacy" = "spaCy",
	"span-marker" = "SpanMarker",
	"speechbrain" = "speechbrain",
	"tensorflowtts" = "TensorFlowTTS",
	"timm" = "Timm",
	"fastai" = "fastai",
	"transformers" = "Transformers",
	"transformers.js" = "Transformers.js",
	"stanza" = "Stanza",
	"fasttext" = "fastText",
	"stable-baselines3" = "Stable-Baselines3",
	"ml-agents" = "Unity ML-Agents",
	"pythae" = "Pythae",
	"mindspore" = "MindSpore",
	"unity-sentis" = "Unity Sentis",
}

export type ModelLibraryKey = keyof typeof ModelLibrary;

export const ALL_MODEL_LIBRARY_KEYS = Object.keys(ModelLibrary) as ModelLibraryKey[];

export const ALL_DISPLAY_MODEL_LIBRARY_KEYS = ALL_MODEL_LIBRARY_KEYS.filter(
	(k) => !["doctr", "k2", "mindspore", "tensorflowtts"].includes(k)
);
