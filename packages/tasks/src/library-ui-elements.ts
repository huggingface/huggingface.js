import type { ModelData } from "./model-data";
import type { ModelLibraryKey } from "./model-libraries";

/**
 * Elements configurable by a model library.
 */
export interface LibraryUiElement {
	/**
	 * Name displayed on the main
	 * call-to-action button on the model page.
	 */
	btnLabel: string;
	/**
	 * Repo name
	 */
	repoName: string;
	/**
	 * URL to library's repo
	 */
	repoUrl: string;
	/**
	 * URL to library's docs
	 */
	docsUrl?: string;
	/**
	 * Code snippet displayed on model page
	 */
	snippets: (model: ModelData) => string[];
}

function nameWithoutNamespace(modelId: string): string {
	const splitted = modelId.split("/");
	return splitted.length === 1 ? splitted[0] : splitted[1];
}

//#region snippets

const adapter_transformers = (model: ModelData) => [
	`from transformers import ${model.config?.adapter_transformers?.model_class}

model = ${model.config?.adapter_transformers?.model_class}.from_pretrained("${model.config?.adapter_transformers?.model_name}")
model.load_adapter("${model.id}", source="hf")`,
];

const allennlpUnknown = (model: ModelData) => [
	`import allennlp_models
from allennlp.predictors.predictor import Predictor

predictor = Predictor.from_path("hf://${model.id}")`,
];

const allennlpQuestionAnswering = (model: ModelData) => [
	`import allennlp_models
from allennlp.predictors.predictor import Predictor

predictor = Predictor.from_path("hf://${model.id}")
predictor_input = {"passage": "My name is Wolfgang and I live in Berlin", "question": "Where do I live?"}
predictions = predictor.predict_json(predictor_input)`,
];

const allennlp = (model: ModelData) => {
	if (model.tags?.includes("question-answering")) {
		return allennlpQuestionAnswering(model);
	}
	return allennlpUnknown(model);
};

const asteroid = (model: ModelData) => [
	`from asteroid.models import BaseModel

model = BaseModel.from_pretrained("${model.id}")`,
];

function get_base_diffusers_model(model: ModelData): string {
	return model.cardData?.base_model?.toString() ?? "fill-in-base-model";
}

const bertopic = (model: ModelData) => [
	`from bertopic import BERTopic

model = BERTopic.load("${model.id}")`,
];

const diffusers_default = (model: ModelData) => [
	`from diffusers import DiffusionPipeline

pipeline = DiffusionPipeline.from_pretrained("${model.id}")`,
];

const diffusers_controlnet = (model: ModelData) => [
	`from diffusers import ControlNetModel, StableDiffusionControlNetPipeline

controlnet = ControlNetModel.from_pretrained("${model.id}")
pipeline = StableDiffusionControlNetPipeline.from_pretrained(
	"${get_base_diffusers_model(model)}", controlnet=controlnet
)`,
];

const diffusers_lora = (model: ModelData) => [
	`from diffusers import DiffusionPipeline

pipeline = DiffusionPipeline.from_pretrained("${get_base_diffusers_model(model)}")
pipeline.load_lora_weights("${model.id}")`,
];

const diffusers_textual_inversion = (model: ModelData) => [
	`from diffusers import DiffusionPipeline

pipeline = DiffusionPipeline.from_pretrained("${get_base_diffusers_model(model)}")
pipeline.load_textual_inversion("${model.id}")`,
];

const diffusers = (model: ModelData) => {
	if (model.tags?.includes("controlnet")) {
		return diffusers_controlnet(model);
	} else if (model.tags?.includes("lora")) {
		return diffusers_lora(model);
	} else if (model.tags?.includes("textual_inversion")) {
		return diffusers_textual_inversion(model);
	} else {
		return diffusers_default(model);
	}
};

const espnetTTS = (model: ModelData) => [
	`from espnet2.bin.tts_inference import Text2Speech

model = Text2Speech.from_pretrained("${model.id}")

speech, *_ = model("text to generate speech from")`,
];

const espnetASR = (model: ModelData) => [
	`from espnet2.bin.asr_inference import Speech2Text

model = Speech2Text.from_pretrained(
  "${model.id}"
)

speech, rate = soundfile.read("speech.wav")
text, *_ = model(speech)[0]`,
];

const espnetUnknown = () => [`unknown model type (must be text-to-speech or automatic-speech-recognition)`];

const espnet = (model: ModelData) => {
	if (model.tags?.includes("text-to-speech")) {
		return espnetTTS(model);
	} else if (model.tags?.includes("automatic-speech-recognition")) {
		return espnetASR(model);
	}
	return espnetUnknown();
};

const fairseq = (model: ModelData) => [
	`from fairseq.checkpoint_utils import load_model_ensemble_and_task_from_hf_hub

models, cfg, task = load_model_ensemble_and_task_from_hf_hub(
    "${model.id}"
)`,
];

const flair = (model: ModelData) => [
	`from flair.models import SequenceTagger

tagger = SequenceTagger.load("${model.id}")`,
];

const keras = (model: ModelData) => [
	`from huggingface_hub import from_pretrained_keras

model = from_pretrained_keras("${model.id}")
`,
];

const open_clip = (model: ModelData) => [
	`import open_clip

model, preprocess_train, preprocess_val = open_clip.create_model_and_transforms('hf-hub:${model.id}')
tokenizer = open_clip.get_tokenizer('hf-hub:${model.id}')`,
];

const paddlenlp = (model: ModelData) => {
	if (model.config?.architectures?.[0]) {
		const architecture = model.config.architectures[0];
		return [
			[
				`from paddlenlp.transformers import AutoTokenizer, ${architecture}`,
				"",
				`tokenizer = AutoTokenizer.from_pretrained("${model.id}", from_hf_hub=True)`,
				`model = ${architecture}.from_pretrained("${model.id}", from_hf_hub=True)`,
			].join("\n"),
		];
	} else {
		return [
			[
				`# ⚠️ Type of model unknown`,
				`from paddlenlp.transformers import AutoTokenizer, AutoModel`,
				"",
				`tokenizer = AutoTokenizer.from_pretrained("${model.id}", from_hf_hub=True)`,
				`model = AutoModel.from_pretrained("${model.id}", from_hf_hub=True)`,
			].join("\n"),
		];
	}
};

const pyannote_audio_pipeline = (model: ModelData) => [
	`from pyannote.audio import Pipeline
  
pipeline = Pipeline.from_pretrained("${model.id}")

# inference on the whole file
pipeline("file.wav")

# inference on an excerpt
from pyannote.core import Segment
excerpt = Segment(start=2.0, end=5.0)

from pyannote.audio import Audio
waveform, sample_rate = Audio().crop("file.wav", excerpt)
pipeline({"waveform": waveform, "sample_rate": sample_rate})`,
];

const pyannote_audio_model = (model: ModelData) => [
	`from pyannote.audio import Model, Inference

model = Model.from_pretrained("${model.id}")
inference = Inference(model)

# inference on the whole file
inference("file.wav")

# inference on an excerpt
from pyannote.core import Segment
excerpt = Segment(start=2.0, end=5.0)
inference.crop("file.wav", excerpt)`,
];

const pyannote_audio = (model: ModelData) => {
	if (model.tags?.includes("pyannote-audio-pipeline")) {
		return pyannote_audio_pipeline(model);
	}
	return pyannote_audio_model(model);
};

const tensorflowttsTextToMel = (model: ModelData) => [
	`from tensorflow_tts.inference import AutoProcessor, TFAutoModel

processor = AutoProcessor.from_pretrained("${model.id}")
model = TFAutoModel.from_pretrained("${model.id}")
`,
];

const tensorflowttsMelToWav = (model: ModelData) => [
	`from tensorflow_tts.inference import TFAutoModel

model = TFAutoModel.from_pretrained("${model.id}")
audios = model.inference(mels)
`,
];

const tensorflowttsUnknown = (model: ModelData) => [
	`from tensorflow_tts.inference import TFAutoModel

model = TFAutoModel.from_pretrained("${model.id}")
`,
];

const tensorflowtts = (model: ModelData) => {
	if (model.tags?.includes("text-to-mel")) {
		return tensorflowttsTextToMel(model);
	} else if (model.tags?.includes("mel-to-wav")) {
		return tensorflowttsMelToWav(model);
	}
	return tensorflowttsUnknown(model);
};

const timm = (model: ModelData) => [
	`import timm

model = timm.create_model("hf_hub:${model.id}", pretrained=True)`,
];

const skopsPickle = (model: ModelData, modelFile: string) => {
	return [
		`import joblib
from skops.hub_utils import download
download("${model.id}", "path_to_folder")
model = joblib.load(
	"${modelFile}"
)
# only load pickle files from sources you trust
# read more about it here https://skops.readthedocs.io/en/stable/persistence.html`,
	];
};

const skopsFormat = (model: ModelData, modelFile: string) => {
	return [
		`from skops.hub_utils import download
from skops.io import load
download("${model.id}", "path_to_folder")
# make sure model file is in skops format
# if model is a pickle file, make sure it's from a source you trust
model = load("path_to_folder/${modelFile}")`,
	];
};

const skopsJobLib = (model: ModelData) => {
	return [
		`from huggingface_hub import hf_hub_download
import joblib
model = joblib.load(
	hf_hub_download("${model.id}", "sklearn_model.joblib")
)
# only load pickle files from sources you trust
# read more about it here https://skops.readthedocs.io/en/stable/persistence.html`,
	];
};

const sklearn = (model: ModelData) => {
	if (model.tags?.includes("skops")) {
		const skopsmodelFile = model.config?.sklearn?.filename;
		const skopssaveFormat = model.config?.sklearn?.model_format;
		if (!skopsmodelFile) {
			return [`# ⚠️ Model filename not specified in config.json`];
		}
		if (skopssaveFormat === "pickle") {
			return skopsPickle(model, skopsmodelFile);
		} else {
			return skopsFormat(model, skopsmodelFile);
		}
	} else {
		return skopsJobLib(model);
	}
};

const fastai = (model: ModelData) => [
	`from huggingface_hub import from_pretrained_fastai

learn = from_pretrained_fastai("${model.id}")`,
];

const sampleFactory = (model: ModelData) => [
	`python -m sample_factory.huggingface.load_from_hub -r ${model.id} -d ./train_dir`,
];

const sentenceTransformers = (model: ModelData) => [
	`from sentence_transformers import SentenceTransformer

model = SentenceTransformer("${model.id}")`,
];

const setfit = (model: ModelData) => [
	`from setfit import SetFitModel

model = SetFitModel.from_pretrained("${model.id}")`,
];

const spacy = (model: ModelData) => [
	`!pip install https://huggingface.co/${model.id}/resolve/main/${nameWithoutNamespace(model.id)}-any-py3-none-any.whl

# Using spacy.load().
import spacy
nlp = spacy.load("${nameWithoutNamespace(model.id)}")

# Importing as module.
import ${nameWithoutNamespace(model.id)}
nlp = ${nameWithoutNamespace(model.id)}.load()`,
];

const span_marker = (model: ModelData) => [
	`from span_marker import SpanMarkerModel

model = SpanMarkerModel.from_pretrained("${model.id}")`,
];

const stanza = (model: ModelData) => [
	`import stanza

stanza.download("${nameWithoutNamespace(model.id).replace("stanza-", "")}")
nlp = stanza.Pipeline("${nameWithoutNamespace(model.id).replace("stanza-", "")}")`,
];

const speechBrainMethod = (speechbrainInterface: string) => {
	switch (speechbrainInterface) {
		case "EncoderClassifier":
			return "classify_file";
		case "EncoderDecoderASR":
		case "EncoderASR":
			return "transcribe_file";
		case "SpectralMaskEnhancement":
			return "enhance_file";
		case "SepformerSeparation":
			return "separate_file";
		default:
			return undefined;
	}
};

const speechbrain = (model: ModelData) => {
	const speechbrainInterface = model.config?.speechbrain?.interface;
	if (speechbrainInterface === undefined) {
		return [`# interface not specified in config.json`];
	}

	const speechbrainMethod = speechBrainMethod(speechbrainInterface);
	if (speechbrainMethod === undefined) {
		return [`# interface in config.json invalid`];
	}

	return [
		`from speechbrain.pretrained import ${speechbrainInterface}
model = ${speechbrainInterface}.from_hparams(
  "${model.id}"
)
model.${speechbrainMethod}("file.wav")`,
	];
};

const transformers = (model: ModelData) => {
	const info = model.transformersInfo;
	if (!info) {
		return [`# ⚠️ Type of model unknown`];
	}
	const remote_code_snippet = info.custom_class ? ", trust_remote_code=True" : "";

	let autoSnippet: string;
	if (info.processor) {
		const varName =
			info.processor === "AutoTokenizer"
				? "tokenizer"
				: info.processor === "AutoFeatureExtractor"
				  ? "extractor"
				  : "processor";
		autoSnippet = [
			"# Load model directly",
			`from transformers import ${info.processor}, ${info.auto_model}`,
			"",
			`${varName} = ${info.processor}.from_pretrained("${model.id}"` + remote_code_snippet + ")",
			`model = ${info.auto_model}.from_pretrained("${model.id}"` + remote_code_snippet + ")",
		].join("\n");
	} else {
		autoSnippet = [
			"# Load model directly",
			`from transformers import ${info.auto_model}`,
			`model = ${info.auto_model}.from_pretrained("${model.id}"` + remote_code_snippet + ")",
		].join("\n");
	}

	if (model.pipeline_tag) {
		const pipelineSnippet = [
			"# Use a pipeline as a high-level helper",
			"from transformers import pipeline",
			"",
			`pipe = pipeline("${model.pipeline_tag}", model="${model.id}"` + remote_code_snippet + ")",
		].join("\n");
		return [pipelineSnippet, autoSnippet];
	}
	return [autoSnippet];
};

const transformersJS = (model: ModelData) => {
	if (!model.pipeline_tag) {
		return [`// ⚠️ Unknown pipeline tag`];
	}

	const libName = "@xenova/transformers";

	return [
		`// npm i ${libName}
import { pipeline } from '${libName}';

// Allocate pipeline
const pipe = await pipeline('${model.pipeline_tag}', '${model.id}');`,
	];
};

const peftTask = (peftTaskType?: string) => {
	switch (peftTaskType) {
		case "CAUSAL_LM":
			return "CausalLM";
		case "SEQ_2_SEQ_LM":
			return "Seq2SeqLM";
		case "TOKEN_CLS":
			return "TokenClassification";
		case "SEQ_CLS":
			return "SequenceClassification";
		default:
			return undefined;
	}
};

const peft = (model: ModelData) => {
	const { base_model_name: peftBaseModel, task_type: peftTaskType } = model.config?.peft ?? {};
	const pefttask = peftTask(peftTaskType);
	if (!pefttask) {
		return [`Task type is invalid.`];
	}
	if (!peftBaseModel) {
		return [`Base model is not found.`];
	}

	return [
		`from peft import PeftModel, PeftConfig
from transformers import AutoModelFor${pefttask}

config = PeftConfig.from_pretrained("${model.id}")
model = AutoModelFor${pefttask}.from_pretrained("${peftBaseModel}")
model = PeftModel.from_pretrained(model, "${model.id}")`,
	];
};

const fasttext = (model: ModelData) => [
	`from huggingface_hub import hf_hub_download
import fasttext

model = fasttext.load_model(hf_hub_download("${model.id}", "model.bin"))`,
];

const stableBaselines3 = (model: ModelData) => [
	`from huggingface_sb3 import load_from_hub
checkpoint = load_from_hub(
	repo_id="${model.id}",
	filename="{MODEL FILENAME}.zip",
)`,
];

const nemoDomainResolver = (domain: string, model: ModelData): string[] | undefined => {
	switch (domain) {
		case "ASR":
			return [
				`import nemo.collections.asr as nemo_asr
asr_model = nemo_asr.models.ASRModel.from_pretrained("${model.id}")

transcriptions = asr_model.transcribe(["file.wav"])`,
			];
		default:
			return undefined;
	}
};

const mlAgents = (model: ModelData) => [`mlagents-load-from-hf --repo-id="${model.id}" --local-dir="./downloads"`];

const sentis = (/* model: ModelData */) => [
	`string modelName = "[Your model name here].sentis";
Model model = ModelLoader.Load(Application.streamingAssetsPath + "/" + modelName);
IWorker engine = WorkerFactory.CreateWorker(BackendType.GPUCompute, model);
// Please see provided C# file for more details
`,
];

const mlx = (model: ModelData) => [
	`pip install huggingface_hub hf_transfer

export HF_HUB_ENABLE_HF_TRANSFER=1
huggingface-cli download --local-dir ${nameWithoutNamespace(model.id)} ${model.id}`,
];

const nemo = (model: ModelData) => {
	let command: string[] | undefined = undefined;
	// Resolve the tag to a nemo domain/sub-domain
	if (model.tags?.includes("automatic-speech-recognition")) {
		command = nemoDomainResolver("ASR", model);
	}

	return command ?? [`# tag did not correspond to a valid NeMo domain.`];
};

const pythae = (model: ModelData) => [
	`from pythae.models import AutoModel

model = AutoModel.load_from_hf_hub("${model.id}")`,
];

//#endregion

export const MODEL_LIBRARIES_UI_ELEMENTS: Partial<Record<ModelLibraryKey, LibraryUiElement>> = {
	"adapter-transformers": {
		btnLabel: "Adapter Transformers",
		repoName: "adapter-transformers",
		repoUrl: "https://github.com/Adapter-Hub/adapter-transformers",
		docsUrl: "https://huggingface.co/docs/hub/adapter-transformers",
		snippets: adapter_transformers,
	},
	allennlp: {
		btnLabel: "AllenNLP",
		repoName: "AllenNLP",
		repoUrl: "https://github.com/allenai/allennlp",
		docsUrl: "https://huggingface.co/docs/hub/allennlp",
		snippets: allennlp,
	},
	asteroid: {
		btnLabel: "Asteroid",
		repoName: "Asteroid",
		repoUrl: "https://github.com/asteroid-team/asteroid",
		docsUrl: "https://huggingface.co/docs/hub/asteroid",
		snippets: asteroid,
	},
	bertopic: {
		btnLabel: "BERTopic",
		repoName: "BERTopic",
		repoUrl: "https://github.com/MaartenGr/BERTopic",
		snippets: bertopic,
	},
	diffusers: {
		btnLabel: "Diffusers",
		repoName: "🤗/diffusers",
		repoUrl: "https://github.com/huggingface/diffusers",
		docsUrl: "https://huggingface.co/docs/hub/diffusers",
		snippets: diffusers,
	},
	espnet: {
		btnLabel: "ESPnet",
		repoName: "ESPnet",
		repoUrl: "https://github.com/espnet/espnet",
		docsUrl: "https://huggingface.co/docs/hub/espnet",
		snippets: espnet,
	},
	fairseq: {
		btnLabel: "Fairseq",
		repoName: "fairseq",
		repoUrl: "https://github.com/pytorch/fairseq",
		snippets: fairseq,
	},
	flair: {
		btnLabel: "Flair",
		repoName: "Flair",
		repoUrl: "https://github.com/flairNLP/flair",
		docsUrl: "https://huggingface.co/docs/hub/flair",
		snippets: flair,
	},
	keras: {
		btnLabel: "Keras",
		repoName: "Keras",
		repoUrl: "https://github.com/keras-team/keras",
		docsUrl: "https://huggingface.co/docs/hub/keras",
		snippets: keras,
	},
	mlx: {
		btnLabel: "MLX",
		repoName: "MLX",
		repoUrl: "https://github.com/ml-explore/mlx-examples/tree/main",
		snippets: mlx,
	},
	nemo: {
		btnLabel: "NeMo",
		repoName: "NeMo",
		repoUrl: "https://github.com/NVIDIA/NeMo",
		snippets: nemo,
	},
	open_clip: {
		btnLabel: "OpenCLIP",
		repoName: "OpenCLIP",
		repoUrl: "https://github.com/mlfoundations/open_clip",
		snippets: open_clip,
	},
	paddlenlp: {
		btnLabel: "paddlenlp",
		repoName: "PaddleNLP",
		repoUrl: "https://github.com/PaddlePaddle/PaddleNLP",
		docsUrl: "https://huggingface.co/docs/hub/paddlenlp",
		snippets: paddlenlp,
	},
	peft: {
		btnLabel: "PEFT",
		repoName: "PEFT",
		repoUrl: "https://github.com/huggingface/peft",
		snippets: peft,
	},
	"pyannote-audio": {
		btnLabel: "pyannote.audio",
		repoName: "pyannote-audio",
		repoUrl: "https://github.com/pyannote/pyannote-audio",
		snippets: pyannote_audio,
	},
	"sentence-transformers": {
		btnLabel: "sentence-transformers",
		repoName: "sentence-transformers",
		repoUrl: "https://github.com/UKPLab/sentence-transformers",
		docsUrl: "https://huggingface.co/docs/hub/sentence-transformers",
		snippets: sentenceTransformers,
	},
	setfit: {
		btnLabel: "setfit",
		repoName: "setfit",
		repoUrl: "https://github.com/huggingface/setfit",
		docsUrl: "https://huggingface.co/docs/hub/setfit",
		snippets: setfit,
	},
	sklearn: {
		btnLabel: "Scikit-learn",
		repoName: "Scikit-learn",
		repoUrl: "https://github.com/scikit-learn/scikit-learn",
		snippets: sklearn,
	},
	fastai: {
		btnLabel: "fastai",
		repoName: "fastai",
		repoUrl: "https://github.com/fastai/fastai",
		docsUrl: "https://huggingface.co/docs/hub/fastai",
		snippets: fastai,
	},
	spacy: {
		btnLabel: "spaCy",
		repoName: "spaCy",
		repoUrl: "https://github.com/explosion/spaCy",
		docsUrl: "https://huggingface.co/docs/hub/spacy",
		snippets: spacy,
	},
	"span-marker": {
		btnLabel: "SpanMarker",
		repoName: "SpanMarkerNER",
		repoUrl: "https://github.com/tomaarsen/SpanMarkerNER",
		docsUrl: "https://huggingface.co/docs/hub/span_marker",
		snippets: span_marker,
	},
	speechbrain: {
		btnLabel: "speechbrain",
		repoName: "speechbrain",
		repoUrl: "https://github.com/speechbrain/speechbrain",
		docsUrl: "https://huggingface.co/docs/hub/speechbrain",
		snippets: speechbrain,
	},
	stanza: {
		btnLabel: "Stanza",
		repoName: "stanza",
		repoUrl: "https://github.com/stanfordnlp/stanza",
		docsUrl: "https://huggingface.co/docs/hub/stanza",
		snippets: stanza,
	},
	tensorflowtts: {
		btnLabel: "TensorFlowTTS",
		repoName: "TensorFlowTTS",
		repoUrl: "https://github.com/TensorSpeech/TensorFlowTTS",
		snippets: tensorflowtts,
	},
	timm: {
		btnLabel: "timm",
		repoName: "pytorch-image-models",
		repoUrl: "https://github.com/rwightman/pytorch-image-models",
		docsUrl: "https://huggingface.co/docs/hub/timm",
		snippets: timm,
	},
	transformers: {
		btnLabel: "Transformers",
		repoName: "🤗/transformers",
		repoUrl: "https://github.com/huggingface/transformers",
		docsUrl: "https://huggingface.co/docs/hub/transformers",
		snippets: transformers,
	},
	"transformers.js": {
		btnLabel: "Transformers.js",
		repoName: "transformers.js",
		repoUrl: "https://github.com/xenova/transformers.js",
		docsUrl: "https://huggingface.co/docs/hub/transformers-js",
		snippets: transformersJS,
	},
	fasttext: {
		btnLabel: "fastText",
		repoName: "fastText",
		repoUrl: "https://fasttext.cc/",
		snippets: fasttext,
	},
	"sample-factory": {
		btnLabel: "sample-factory",
		repoName: "sample-factory",
		repoUrl: "https://github.com/alex-petrenko/sample-factory",
		docsUrl: "https://huggingface.co/docs/hub/sample-factory",
		snippets: sampleFactory,
	},
	"stable-baselines3": {
		btnLabel: "stable-baselines3",
		repoName: "stable-baselines3",
		repoUrl: "https://github.com/huggingface/huggingface_sb3",
		docsUrl: "https://huggingface.co/docs/hub/stable-baselines3",
		snippets: stableBaselines3,
	},
	"ml-agents": {
		btnLabel: "ml-agents",
		repoName: "ml-agents",
		repoUrl: "https://github.com/Unity-Technologies/ml-agents",
		docsUrl: "https://huggingface.co/docs/hub/ml-agents",
		snippets: mlAgents,
	},
	"unity-sentis": {
		btnLabel: "unity-sentis",
		repoName: "unity-sentis",
		repoUrl: "https://github.com/Unity-Technologies/sentis-samples",
		snippets: sentis,
	},
	pythae: {
		btnLabel: "pythae",
		repoName: "pythae",
		repoUrl: "https://github.com/clementchadebec/benchmark_VAE",
		snippets: pythae,
	},
} as const;
