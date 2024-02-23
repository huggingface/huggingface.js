import type { ModelData } from "./model-data";

const TAG_CUSTOM_CODE = "custom_code";

function nameWithoutNamespace(modelId: string): string {
	const splitted = modelId.split("/");
	return splitted.length === 1 ? splitted[0] : splitted[1];
}

//#region snippets

export const adapters = (model: ModelData): string[] => [
	`from adapters import AutoAdapterModel

model = AutoAdapterModel.from_pretrained("${model.config?.adapter_transformers?.model_name}")
model.load_adapter("${model.id}", set_active=True)`,
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

export const allennlp = (model: ModelData): string[] => {
	if (model.tags?.includes("question-answering")) {
		return allennlpQuestionAnswering(model);
	}
	return allennlpUnknown(model);
};

export const asteroid = (model: ModelData): string[] => [
	`from asteroid.models import BaseModel

model = BaseModel.from_pretrained("${model.id}")`,
];

function get_base_diffusers_model(model: ModelData): string {
	return model.cardData?.base_model?.toString() ?? "fill-in-base-model";
}

export const bertopic = (model: ModelData): string[] => [
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

export const diffusers = (model: ModelData): string[] => {
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

export const espnetTTS = (model: ModelData): string[] => [
	`from espnet2.bin.tts_inference import Text2Speech

model = Text2Speech.from_pretrained("${model.id}")

speech, *_ = model("text to generate speech from")`,
];

export const espnetASR = (model: ModelData): string[] => [
	`from espnet2.bin.asr_inference import Speech2Text

model = Speech2Text.from_pretrained(
  "${model.id}"
)

speech, rate = soundfile.read("speech.wav")
text, *_ = model(speech)[0]`,
];

const espnetUnknown = () => [`unknown model type (must be text-to-speech or automatic-speech-recognition)`];

export const espnet = (model: ModelData): string[] => {
	if (model.tags?.includes("text-to-speech")) {
		return espnetTTS(model);
	} else if (model.tags?.includes("automatic-speech-recognition")) {
		return espnetASR(model);
	}
	return espnetUnknown();
};

export const fairseq = (model: ModelData): string[] => [
	`from fairseq.checkpoint_utils import load_model_ensemble_and_task_from_hf_hub

models, cfg, task = load_model_ensemble_and_task_from_hf_hub(
    "${model.id}"
)`,
];

export const flair = (model: ModelData): string[] => [
	`from flair.models import SequenceTagger

tagger = SequenceTagger.load("${model.id}")`,
];

export const keras = (model: ModelData): string[] => [
	`from huggingface_hub import from_pretrained_keras

model = from_pretrained_keras("${model.id}")
`,
];

export const open_clip = (model: ModelData): string[] => [
	`import open_clip

model, preprocess_train, preprocess_val = open_clip.create_model_and_transforms('hf-hub:${model.id}')
tokenizer = open_clip.get_tokenizer('hf-hub:${model.id}')`,
];

export const paddlenlp = (model: ModelData): string[] => {
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

export const pyannote_audio_pipeline = (model: ModelData): string[] => [
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

const pyannote_audio_model = (model: ModelData): string[] => [
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

export const pyannote_audio = (model: ModelData): string[] => {
	if (model.tags?.includes("pyannote-audio-pipeline")) {
		return pyannote_audio_pipeline(model);
	}
	return pyannote_audio_model(model);
};

const tensorflowttsTextToMel = (model: ModelData): string[] => [
	`from tensorflow_tts.inference import AutoProcessor, TFAutoModel

processor = AutoProcessor.from_pretrained("${model.id}")
model = TFAutoModel.from_pretrained("${model.id}")
`,
];

const tensorflowttsMelToWav = (model: ModelData): string[] => [
	`from tensorflow_tts.inference import TFAutoModel

model = TFAutoModel.from_pretrained("${model.id}")
audios = model.inference(mels)
`,
];

const tensorflowttsUnknown = (model: ModelData): string[] => [
	`from tensorflow_tts.inference import TFAutoModel

model = TFAutoModel.from_pretrained("${model.id}")
`,
];

export const tensorflowtts = (model: ModelData): string[] => {
	if (model.tags?.includes("text-to-mel")) {
		return tensorflowttsTextToMel(model);
	} else if (model.tags?.includes("mel-to-wav")) {
		return tensorflowttsMelToWav(model);
	}
	return tensorflowttsUnknown(model);
};

export const timm = (model: ModelData): string[] => [
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

export const sklearn = (model: ModelData): string[] => {
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

export const fastai = (model: ModelData): string[] => [
	`from huggingface_hub import from_pretrained_fastai

learn = from_pretrained_fastai("${model.id}")`,
];

export const sampleFactory = (model: ModelData): string[] => [
	`python -m sample_factory.huggingface.load_from_hub -r ${model.id} -d ./train_dir`,
];

export const sentenceTransformers = (model: ModelData): string[] => [
	`from sentence_transformers import SentenceTransformer

model = SentenceTransformer("${model.id}")`,
];

export const setfit = (model: ModelData): string[] => [
	`from setfit import SetFitModel

model = SetFitModel.from_pretrained("${model.id}")`,
];

export const spacy = (model: ModelData): string[] => [
	`!pip install https://huggingface.co/${model.id}/resolve/main/${nameWithoutNamespace(model.id)}-any-py3-none-any.whl

# Using spacy.load().
import spacy
nlp = spacy.load("${nameWithoutNamespace(model.id)}")

# Importing as module.
import ${nameWithoutNamespace(model.id)}
nlp = ${nameWithoutNamespace(model.id)}.load()`,
];

export const span_marker = (model: ModelData): string[] => [
	`from span_marker import SpanMarkerModel

model = SpanMarkerModel.from_pretrained("${model.id}")`,
];

export const stanza = (model: ModelData): string[] => [
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

export const speechbrain = (model: ModelData): string[] => {
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

export const transformers = (model: ModelData): string[] => {
	const info = model.transformersInfo;
	if (!info) {
		return [`# ⚠️ Type of model unknown`];
	}
	const remote_code_snippet = model.tags?.includes(TAG_CUSTOM_CODE) ? ", trust_remote_code=True" : "";

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

export const transformersJS = (model: ModelData): string[] => {
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

export const peft = (model: ModelData): string[] => {
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

export const fasttext = (model: ModelData): string[] => [
	`from huggingface_hub import hf_hub_download
import fasttext

model = fasttext.load_model(hf_hub_download("${model.id}", "model.bin"))`,
];

export const stableBaselines3 = (model: ModelData): string[] => [
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

export const mlAgents = (model: ModelData): string[] => [
	`mlagents-load-from-hf --repo-id="${model.id}" --local-dir="./download: string[]s"`,
];

export const sentis = (/* model: ModelData */): string[] => [
	`string modelName = "[Your model name here].sentis";
Model model = ModelLoader.Load(Application.streamingAssetsPath + "/" + modelName);
IWorker engine = WorkerFactory.CreateWorker(BackendType.GPUCompute, model);
// Please see provided C# file for more details
`,
];

export const mlx = (model: ModelData): string[] => [
	`pip install huggingface_hub hf_transfer

export HF_HUB_ENABLE_HF_TRANS: string[]FER=1
huggingface-cli download --local-dir ${nameWithoutNamespace(model.id)} ${model.id}`,
];

export const nemo = (model: ModelData): string[] => {
	let command: string[] | undefined = undefined;
	// Resolve the tag to a nemo domain/sub-domain
	if (model.tags?.includes("automatic-speech-recognition")) {
		command = nemoDomainResolver("ASR", model);
	}

	return command ?? [`# tag did not correspond to a valid NeMo domain.`];
};

export const pythae = (model: ModelData): string[] => [
	`from pythae.models import AutoModel

model = AutoModel.load_from_hf_hub("${model.id}")`,
];


export const musicgen = (model: ModelData): string[] => [
	`from audiocraft.models import MusicGen

model = MusicGen.get_pretrained("${model.id}")

descriptions = ['happy rock', 'energetic EDM', 'sad jazz']
wav = model.generate(descriptions)  # generates 3 samples.`,
];

//#endregion
