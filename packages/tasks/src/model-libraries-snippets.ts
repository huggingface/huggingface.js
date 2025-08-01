import type { ModelData } from "./model-data.js";
import type { WidgetExampleTextInput, WidgetExampleSentenceSimilarityInput } from "./widget-example.js";
import { LIBRARY_TASK_MAPPING } from "./library-to-tasks.js";
import { getModelInputSnippet } from "./snippets/inputs.js";
import type { ChatCompletionInputMessage } from "./tasks/index.js";
import { stringifyMessages } from "./snippets/common.js";

const TAG_CUSTOM_CODE = "custom_code";

function nameWithoutNamespace(modelId: string): string {
	const splitted = modelId.split("/");
	return splitted.length === 1 ? splitted[0] : splitted[1];
}

const escapeStringForJson = (str: string): string => JSON.stringify(str).slice(1, -1); // slice is needed to remove surrounding quotes added by JSON.stringify

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
	if (model.tags.includes("question-answering")) {
		return allennlpQuestionAnswering(model);
	}
	return allennlpUnknown(model);
};

export const araclip = (model: ModelData): string[] => [
	`from araclip import AraClip

model = AraClip.from_pretrained("${model.id}")`,
];

export const asteroid = (model: ModelData): string[] => [
	`from asteroid.models import BaseModel

model = BaseModel.from_pretrained("${model.id}")`,
];

export const audioseal = (model: ModelData): string[] => {
	const watermarkSnippet = `# Watermark Generator
from audioseal import AudioSeal

model = AudioSeal.load_generator("${model.id}")
# pass a tensor (tensor_wav) of shape (batch, channels, samples) and a sample rate
wav, sr = tensor_wav, 16000
	
watermark = model.get_watermark(wav, sr)
watermarked_audio = wav + watermark`;

	const detectorSnippet = `# Watermark Detector
from audioseal import AudioSeal

detector = AudioSeal.load_detector("${model.id}")
	
result, message = detector.detect_watermark(watermarked_audio, sr)`;
	return [watermarkSnippet, detectorSnippet];
};

function get_base_diffusers_model(model: ModelData): string {
	return model.cardData?.base_model?.toString() ?? "fill-in-base-model";
}

function get_prompt_from_diffusers_model(model: ModelData): string | undefined {
	const prompt = (model.widgetData?.[0] as WidgetExampleTextInput | undefined)?.text ?? model.cardData?.instance_prompt;
	if (prompt) {
		return escapeStringForJson(prompt);
	}
}

export const ben2 = (model: ModelData): string[] => [
	`import requests
from PIL import Image
from ben2 import AutoModel

url = "https://huggingface.co/datasets/mishig/sample_images/resolve/main/teapot.jpg"
image = Image.open(requests.get(url, stream=True).raw)

model = AutoModel.from_pretrained("${model.id}")
model.to("cuda").eval()
foreground = model.inference(image)
`,
];

export const bertopic = (model: ModelData): string[] => [
	`from bertopic import BERTopic

model = BERTopic.load("${model.id}")`,
];

export const bm25s = (model: ModelData): string[] => [
	`from bm25s.hf import BM25HF

retriever = BM25HF.load_from_hub("${model.id}")`,
];

export const chatterbox = (): string[] => [
	`# pip install chatterbox-tts
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

model = ChatterboxTTS.from_pretrained(device="cuda")

text = "Ezreal and Jinx teamed up with Ahri, Yasuo, and Teemo to take down the enemy's Nexus in an epic late-game pentakill."
wav = model.generate(text)
ta.save("test-1.wav", wav, model.sr)

# If you want to synthesize with a different voice, specify the audio prompt
AUDIO_PROMPT_PATH="YOUR_FILE.wav"
wav = model.generate(text, audio_prompt_path=AUDIO_PROMPT_PATH)
ta.save("test-2.wav", wav, model.sr)`,
];

export const contexttab = (): string[] => {
	const installSnippet = `pip install git+https://github.com/SAP-samples/contexttab`;

	const classificationSnippet = `# Run a classification task
from sklearn.datasets import load_breast_cancer
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

from contexttab import ConTextTabClassifier

# Load sample data
X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=42)

# Initialize a classifier
# You can omit checkpoint and checkpoint_revision to use the default model
clf = ConTextTabClassifier(checkpoint="l2/base.pt", checkpoint_revision="v1.0.0", bagging=1, max_context_size=2048)

clf.fit(X_train, y_train)

# Predict probabilities
prediction_probabilities = clf.predict_proba(X_test)
# Predict labels
predictions = clf.predict(X_test)
print("Accuracy", accuracy_score(y_test, predictions))`;

	const regressionsSnippet = `# Run a regression task
from sklearn.datasets import fetch_openml
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split

from contexttab import ConTextTabRegressor


# Load sample data
df = fetch_openml(data_id=531, as_frame=True)
X = df.data
y = df.target.astype(float)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=42)

# Initialize the regressor
# You can omit checkpoint and checkpoint_revision to use the default model
regressor = ConTextTabRegressor(checkpoint="l2/base.pt", checkpoint_revision="v1.0.0", bagging=1, max_context_size=2048)

regressor.fit(X_train, y_train)

# Predict on the test set
predictions = regressor.predict(X_test)

r2 = r2_score(y_test, predictions)
print("R² Score:", r2)`;
	return [installSnippet, classificationSnippet, regressionsSnippet];
};

export const cxr_foundation = (): string[] => [
	`# pip install git+https://github.com/Google-Health/cxr-foundation.git#subdirectory=python

# Load image as grayscale (Stillwaterising, CC0, via Wikimedia Commons)
import requests
from PIL import Image
from io import BytesIO
image_url = "https://upload.wikimedia.org/wikipedia/commons/c/c8/Chest_Xray_PA_3-8-2010.png"
img = Image.open(requests.get(image_url, headers={'User-Agent': 'Demo'}, stream=True).raw).convert('L')

# Run inference
from clientside.clients import make_hugging_face_client
cxr_client = make_hugging_face_client('cxr_model')
print(cxr_client.get_image_embeddings_from_images([img]))`,
];

export const depth_anything_v2 = (model: ModelData): string[] => {
	let encoder: string;
	let features: string;
	let out_channels: string;

	encoder = "<ENCODER>";
	features = "<NUMBER_OF_FEATURES>";
	out_channels = "<OUT_CHANNELS>";

	if (model.id === "depth-anything/Depth-Anything-V2-Small") {
		encoder = "vits";
		features = "64";
		out_channels = "[48, 96, 192, 384]";
	} else if (model.id === "depth-anything/Depth-Anything-V2-Base") {
		encoder = "vitb";
		features = "128";
		out_channels = "[96, 192, 384, 768]";
	} else if (model.id === "depth-anything/Depth-Anything-V2-Large") {
		encoder = "vitl";
		features = "256";
		out_channels = "[256, 512, 1024, 1024";
	}

	return [
		`
# Install from https://github.com/DepthAnything/Depth-Anything-V2

# Load the model and infer depth from an image
import cv2
import torch

from depth_anything_v2.dpt import DepthAnythingV2

# instantiate the model
model = DepthAnythingV2(encoder="${encoder}", features=${features}, out_channels=${out_channels})

# load the weights
filepath = hf_hub_download(repo_id="${model.id}", filename="depth_anything_v2_${encoder}.pth", repo_type="model")
state_dict = torch.load(filepath, map_location="cpu")
model.load_state_dict(state_dict).eval()

raw_img = cv2.imread("your/image/path")
depth = model.infer_image(raw_img) # HxW raw depth map in numpy
    `,
	];
};

export const depth_pro = (model: ModelData): string[] => {
	const installSnippet = `# Download checkpoint
pip install huggingface-hub
huggingface-cli download --local-dir checkpoints ${model.id}`;

	const inferenceSnippet = `import depth_pro

# Load model and preprocessing transform
model, transform = depth_pro.create_model_and_transforms()
model.eval()

# Load and preprocess an image.
image, _, f_px = depth_pro.load_rgb("example.png")
image = transform(image)

# Run inference.
prediction = model.infer(image, f_px=f_px)

# Results: 1. Depth in meters
depth = prediction["depth"]
# Results: 2. Focal length in pixels
focallength_px = prediction["focallength_px"]`;

	return [installSnippet, inferenceSnippet];
};

export const derm_foundation = (): string[] => [
	`from huggingface_hub import from_pretrained_keras
import tensorflow as tf, requests

# Load and format input
IMAGE_URL = "https://storage.googleapis.com/dx-scin-public-data/dataset/images/3445096909671059178.png"
input_tensor = tf.train.Example(
    features=tf.train.Features(
        feature={
            "image/encoded": tf.train.Feature(
                bytes_list=tf.train.BytesList(value=[requests.get(IMAGE_URL, stream=True).content])
            )
        }
    )
).SerializeToString()

# Load model and run inference
loaded_model = from_pretrained_keras("google/derm-foundation")
infer = loaded_model.signatures["serving_default"]
print(infer(inputs=tf.constant([input_tensor])))`,
];

export const dia = (model: ModelData): string[] => [
	`import soundfile as sf
from dia.model import Dia

model = Dia.from_pretrained("${model.id}")
text = "[S1] Dia is an open weights text to dialogue model. [S2] You get full control over scripts and voices. [S1] Wow. Amazing. (laughs) [S2] Try it now on Git hub or Hugging Face."
output = model.generate(text)

sf.write("simple.mp3", output, 44100)`,
];

export const describe_anything = (model: ModelData): string[] => [
	`# pip install git+https://github.com/NVlabs/describe-anything
from huggingface_hub import snapshot_download
from dam import DescribeAnythingModel

snapshot_download(${model.id}, local_dir="checkpoints")

dam = DescribeAnythingModel(
	model_path="checkpoints",
	conv_mode="v1",
	prompt_mode="focal_prompt",
)`,
];

const diffusersDefaultPrompt = "Astronaut in a jungle, cold color palette, muted colors, detailed, 8k";

const diffusersImg2ImgDefaultPrompt = "Turn this cat into a dog";

const diffusersVideoDefaultPrompt = "A man with short gray hair plays a red electric guitar.";

const diffusers_default = (model: ModelData) => [
	`from diffusers import DiffusionPipeline

pipe = DiffusionPipeline.from_pretrained("${model.id}")

prompt = "${get_prompt_from_diffusers_model(model) ?? diffusersDefaultPrompt}"
image = pipe(prompt).images[0]`,
];

const diffusers_image_to_image = (model: ModelData) => [
	`from diffusers import DiffusionPipeline
from diffusers.utils import load_image

pipe = DiffusionPipeline.from_pretrained("${model.id}")

prompt = "${get_prompt_from_diffusers_model(model) ?? diffusersImg2ImgDefaultPrompt}"
input_image = load_image("https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/cat.png")

image = pipe(image=input_image, prompt=prompt).images[0]`,
];

const diffusers_image_to_video = (model: ModelData) => [
	`import torch
from diffusers import DiffusionPipeline
from diffusers.utils import load_image, export_to_video

pipe = DiffusionPipeline.from_pretrained("${model.id}", torch_dtype=torch.float16)
pipe.to("cuda")

prompt = "${get_prompt_from_diffusers_model(model) ?? diffusersVideoDefaultPrompt}"
image = load_image(
    "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/guitar-man.png"
)

output = pipe(image=image, prompt=prompt).frames[0]
export_to_video(output, "output.mp4")`,
];

const diffusers_controlnet = (model: ModelData) => [
	`from diffusers import ControlNetModel, StableDiffusionControlNetPipeline

controlnet = ControlNetModel.from_pretrained("${model.id}")
pipe = StableDiffusionControlNetPipeline.from_pretrained(
	"${get_base_diffusers_model(model)}", controlnet=controlnet
)`,
];

const diffusers_lora = (model: ModelData) => [
	`from diffusers import DiffusionPipeline

pipe = DiffusionPipeline.from_pretrained("${get_base_diffusers_model(model)}")
pipe.load_lora_weights("${model.id}")

prompt = "${get_prompt_from_diffusers_model(model) ?? diffusersDefaultPrompt}"
image = pipe(prompt).images[0]`,
];

const diffusers_lora_image_to_image = (model: ModelData) => [
	`from diffusers import DiffusionPipeline
from diffusers.utils import load_image

pipe = DiffusionPipeline.from_pretrained("${get_base_diffusers_model(model)}")
pipe.load_lora_weights("${model.id}")

prompt = "${get_prompt_from_diffusers_model(model) ?? diffusersImg2ImgDefaultPrompt}"
input_image = load_image("https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/cat.png")

image = pipe(image=input_image, prompt=prompt).images[0]`,
];

const diffusers_lora_text_to_video = (model: ModelData) => [
	`from diffusers import DiffusionPipeline
from diffusers.utils import export_to_video

pipe = DiffusionPipeline.from_pretrained("${get_base_diffusers_model(model)}")
pipe.load_lora_weights("${model.id}")

prompt = "${get_prompt_from_diffusers_model(model) ?? diffusersVideoDefaultPrompt}"

output = pipe(prompt=prompt).frames[0]
export_to_video(output, "output.mp4")`,
];

const diffusers_lora_image_to_video = (model: ModelData) => [
	`from diffusers import DiffusionPipeline
from diffusers.utils import load_image, export_to_video

pipe = DiffusionPipeline.from_pretrained("${get_base_diffusers_model(model)}")
pipe.load_lora_weights("${model.id}")

prompt = "${get_prompt_from_diffusers_model(model) ?? diffusersVideoDefaultPrompt}"
input_image = load_image("https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/guitar-man.png")

image = pipe(image=input_image, prompt=prompt).frames[0]
export_to_video(output, "output.mp4")`,
];

const diffusers_textual_inversion = (model: ModelData) => [
	`from diffusers import DiffusionPipeline

pipe = DiffusionPipeline.from_pretrained("${get_base_diffusers_model(model)}")
pipe.load_textual_inversion("${model.id}")`,
];

const diffusers_flux_fill = (model: ModelData) => [
	`import torch
from diffusers import FluxFillPipeline
from diffusers.utils import load_image

image = load_image("https://huggingface.co/datasets/diffusers/diffusers-images-docs/resolve/main/cup.png")
mask = load_image("https://huggingface.co/datasets/diffusers/diffusers-images-docs/resolve/main/cup_mask.png")

pipe = FluxFillPipeline.from_pretrained("${model.id}", torch_dtype=torch.bfloat16).to("cuda")
image = pipe(
    prompt="a white paper cup",
    image=image,
    mask_image=mask,
    height=1632,
    width=1232,
    guidance_scale=30,
    num_inference_steps=50,
    max_sequence_length=512,
    generator=torch.Generator("cpu").manual_seed(0)
).images[0]
image.save(f"flux-fill-dev.png")`,
];

const diffusers_inpainting = (model: ModelData) => [
	`import torch
from diffusers import AutoPipelineForInpainting
from diffusers.utils import load_image

pipe = AutoPipelineForInpainting.from_pretrained("${model.id}", torch_dtype=torch.float16, variant="fp16").to("cuda")

img_url = "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo.png"
mask_url = "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo_mask.png"

image = load_image(img_url).resize((1024, 1024))
mask_image = load_image(mask_url).resize((1024, 1024))

prompt = "a tiger sitting on a park bench"
generator = torch.Generator(device="cuda").manual_seed(0)

image = pipe(
  prompt=prompt,
  image=image,
  mask_image=mask_image,
  guidance_scale=8.0,
  num_inference_steps=20,  # steps between 15 and 30 work well for us
  strength=0.99,  # make sure to use \`strength\` below 1.0
  generator=generator,
).images[0]`,
];

export const diffusers = (model: ModelData): string[] => {
	if (
		model.tags.includes("StableDiffusionInpaintPipeline") ||
		model.tags.includes("StableDiffusionXLInpaintPipeline")
	) {
		return diffusers_inpainting(model);
	} else if (model.tags.includes("controlnet")) {
		return diffusers_controlnet(model);
	} else if (model.tags.includes("lora")) {
		if (model.pipeline_tag === "image-to-image") {
			return diffusers_lora_image_to_image(model);
		} else if (model.pipeline_tag === "image-to-video") {
			return diffusers_lora_image_to_video(model);
		} else if (model.pipeline_tag === "text-to-video") {
			return diffusers_lora_text_to_video(model);
		} else {
			return diffusers_lora(model);
		}
	} else if (model.tags.includes("textual_inversion")) {
		return diffusers_textual_inversion(model);
	} else if (model.tags.includes("FluxFillPipeline")) {
		return diffusers_flux_fill(model);
	} else if (model.pipeline_tag === "image-to-video") {
		return diffusers_image_to_video(model);
	} else if (model.pipeline_tag === "image-to-image") {
		return diffusers_image_to_image(model);
	} else {
		return diffusers_default(model);
	}
};

export const diffusionkit = (model: ModelData): string[] => {
	const sd3Snippet = `# Pipeline for Stable Diffusion 3
from diffusionkit.mlx import DiffusionPipeline

pipeline = DiffusionPipeline(
	shift=3.0,
	use_t5=False,
	model_version=${model.id},
	low_memory_mode=True,
	a16=True,
	w16=True,
)`;

	const fluxSnippet = `# Pipeline for Flux
from diffusionkit.mlx import FluxPipeline

pipeline = FluxPipeline(
  shift=1.0,
  model_version=${model.id},
  low_memory_mode=True,
  a16=True,
  w16=True,
)`;

	const generateSnippet = `# Image Generation
HEIGHT = 512
WIDTH = 512
NUM_STEPS = ${model.tags.includes("flux") ? 4 : 50}
CFG_WEIGHT = ${model.tags.includes("flux") ? 0 : 5}

image, _ = pipeline.generate_image(
  "a photo of a cat",
  cfg_weight=CFG_WEIGHT,
  num_steps=NUM_STEPS,
  latent_size=(HEIGHT // 8, WIDTH // 8),
)`;

	const pipelineSnippet = model.tags.includes("flux") ? fluxSnippet : sd3Snippet;

	return [pipelineSnippet, generateSnippet];
};

export const cartesia_pytorch = (model: ModelData): string[] => [
	`# pip install --no-binary :all: cartesia-pytorch
from cartesia_pytorch import ReneLMHeadModel
from transformers import AutoTokenizer

model = ReneLMHeadModel.from_pretrained("${model.id}")
tokenizer = AutoTokenizer.from_pretrained("allenai/OLMo-1B-hf")

in_message = ["Rene Descartes was"]
inputs = tokenizer(in_message, return_tensors="pt")

outputs = model.generate(inputs.input_ids, max_length=50, top_k=100, top_p=0.99)
out_message = tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]

print(out_message)
)`,
];

export const cartesia_mlx = (model: ModelData): string[] => [
	`import mlx.core as mx
import cartesia_mlx as cmx

model = cmx.from_pretrained("${model.id}")
model.set_dtype(mx.float32)   

prompt = "Rene Descartes was"

for text in model.generate(
    prompt,
    max_tokens=500,
    eval_every_n=5,
    verbose=True,
    top_p=0.99,
    temperature=0.85,
):
    print(text, end="", flush=True)
`,
];

export const edsnlp = (model: ModelData): string[] => {
	const packageName = nameWithoutNamespace(model.id).replaceAll("-", "_");
	return [
		`# Load it from the Hub directly
import edsnlp
nlp = edsnlp.load("${model.id}")
`,
		`# Or install it as a package
!pip install git+https://huggingface.co/${model.id}

# and import it as a module
import ${packageName}

nlp = ${packageName}.load()  # or edsnlp.load("${packageName}")
`,
	];
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
	if (model.tags.includes("text-to-speech")) {
		return espnetTTS(model);
	} else if (model.tags.includes("automatic-speech-recognition")) {
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

export const gliner = (model: ModelData): string[] => [
	`from gliner import GLiNER

model = GLiNER.from_pretrained("${model.id}")`,
];

export const indextts = (model: ModelData): string[] => [
	`# Download model
from huggingface_hub import snapshot_download

snapshot_download(${model.id}, local_dir="checkpoints")

from indextts.infer import IndexTTS

# Ensure config.yaml is present in the checkpoints directory
tts = IndexTTS(model_dir="checkpoints", cfg_path="checkpoints/config.yaml")

voice = "path/to/your/reference_voice.wav"  # Path to the voice reference audio file
text = "Hello, how are you?"
output_path = "output_index.wav"

tts.infer(voice, text, output_path)`,
];

export const htrflow = (model: ModelData): string[] => [
	`# CLI usage
# see docs: https://ai-riksarkivet.github.io/htrflow/latest/getting_started/quick_start.html
htrflow pipeline <path/to/pipeline.yaml> <path/to/image>`,
	`# Python usage
from htrflow.pipeline.pipeline import Pipeline
from htrflow.pipeline.steps import Task
from htrflow.models.framework.model import ModelClass

pipeline = Pipeline(
    [
        Task(
            ModelClass, {"model": "${model.id}"}, {}
        ),
    ])`,
];

export const keras = (model: ModelData): string[] => [
	`# Available backend options are: "jax", "torch", "tensorflow".
import os
os.environ["KERAS_BACKEND"] = "jax"
	
import keras

model = keras.saving.load_model("hf://${model.id}")
`,
];

const _keras_hub_causal_lm = (modelId: string): string => `
import keras_hub

# Load CausalLM model (optional: use half precision for inference)
causal_lm = keras_hub.models.CausalLM.from_preset("hf://${modelId}", dtype="bfloat16")
causal_lm.compile(sampler="greedy")  # (optional) specify a sampler

# Generate text
causal_lm.generate("Keras: deep learning for", max_length=64)
`;

const _keras_hub_text_to_image = (modelId: string): string => `
import keras_hub

# Load TextToImage model (optional: use half precision for inference)
text_to_image = keras_hub.models.TextToImage.from_preset("hf://${modelId}", dtype="bfloat16")

# Generate images with a TextToImage model.
text_to_image.generate("Astronaut in a jungle")
`;

const _keras_hub_text_classifier = (modelId: string): string => `
import keras_hub

# Load TextClassifier model
text_classifier = keras_hub.models.TextClassifier.from_preset(
    "hf://${modelId}",
    num_classes=2,
)
# Fine-tune
text_classifier.fit(x=["Thilling adventure!", "Total snoozefest."], y=[1, 0])
# Classify text
text_classifier.predict(["Not my cup of tea."])
`;

const _keras_hub_image_classifier = (modelId: string): string => `
import keras_hub
import keras

# Load ImageClassifier model
image_classifier = keras_hub.models.ImageClassifier.from_preset(
    "hf://${modelId}",
    num_classes=2,
)
# Fine-tune
image_classifier.fit(
    x=keras.random.randint((32, 64, 64, 3), 0, 256),
    y=keras.random.randint((32, 1), 0, 2),
)
# Classify image
image_classifier.predict(keras.random.randint((1, 64, 64, 3), 0, 256))
`;

const _keras_hub_tasks_with_example = {
	CausalLM: _keras_hub_causal_lm,
	TextToImage: _keras_hub_text_to_image,
	TextClassifier: _keras_hub_text_classifier,
	ImageClassifier: _keras_hub_image_classifier,
};

const _keras_hub_task_without_example = (task: string, modelId: string): string => `
import keras_hub

# Create a ${task} model
task = keras_hub.models.${task}.from_preset("hf://${modelId}")
`;

const _keras_hub_generic_backbone = (modelId: string): string => `
import keras_hub

# Create a Backbone model unspecialized for any task
backbone = keras_hub.models.Backbone.from_preset("hf://${modelId}")
`;

export const keras_hub = (model: ModelData): string[] => {
	const modelId = model.id;
	const tasks = model.config?.keras_hub?.tasks ?? [];

	const snippets: string[] = [];

	// First, generate tasks with examples
	for (const [task, snippet] of Object.entries(_keras_hub_tasks_with_example)) {
		if (tasks.includes(task)) {
			snippets.push(snippet(modelId));
		}
	}
	// Then, add remaining tasks
	for (const task of tasks) {
		if (!Object.keys(_keras_hub_tasks_with_example).includes(task)) {
			snippets.push(_keras_hub_task_without_example(task, modelId));
		}
	}
	// Finally, add generic backbone snippet
	snippets.push(_keras_hub_generic_backbone(modelId));

	return snippets;
};

export const kimi_audio = (model: ModelData): string[] => [
	`# Example usage for KimiAudio
# pip install git+https://github.com/MoonshotAI/Kimi-Audio.git

from kimia_infer.api.kimia import KimiAudio

model = KimiAudio(model_path="${model.id}", load_detokenizer=True)

sampling_params = {
    "audio_temperature": 0.8,
    "audio_top_k": 10,
    "text_temperature": 0.0,
    "text_top_k": 5,
}

# For ASR
asr_audio = "asr_example.wav"
messages_asr = [
    {"role": "user", "message_type": "text", "content": "Please transcribe the following audio:"},
    {"role": "user", "message_type": "audio", "content": asr_audio}
]
_, text = model.generate(messages_asr, **sampling_params, output_type="text")
print(text)

# For Q&A
qa_audio = "qa_example.wav"
messages_conv = [{"role": "user", "message_type": "audio", "content": qa_audio}]
wav, text = model.generate(messages_conv, **sampling_params, output_type="both")
sf.write("output_audio.wav", wav.cpu().view(-1).numpy(), 24000)
print(text)
`,
];

export const lightning_ir = (model: ModelData): string[] => {
	if (model.tags.includes("bi-encoder")) {
		return [
			`#install from https://github.com/webis-de/lightning-ir

from lightning_ir import BiEncoderModule
model = BiEncoderModule("${model.id}")

model.score("query", ["doc1", "doc2", "doc3"])`,
		];
	} else if (model.tags.includes("cross-encoder")) {
		return [
			`#install from https://github.com/webis-de/lightning-ir

from lightning_ir import CrossEncoderModule
model = CrossEncoderModule("${model.id}")

model.score("query", ["doc1", "doc2", "doc3"])`,
		];
	}
	return [
		`#install from https://github.com/webis-de/lightning-ir

from lightning_ir import BiEncoderModule, CrossEncoderModule

# depending on the model type, use either BiEncoderModule or CrossEncoderModule
model = BiEncoderModule("${model.id}") 
# model = CrossEncoderModule("${model.id}")

model.score("query", ["doc1", "doc2", "doc3"])`,
	];
};

export const llama_cpp_python = (model: ModelData): string[] => {
	const snippets = [
		`# !pip install llama-cpp-python

from llama_cpp import Llama

llm = Llama.from_pretrained(
	repo_id="${model.id}",
	filename="{{GGUF_FILE}}",
)
`,
	];

	if (model.tags.includes("conversational")) {
		const messages = getModelInputSnippet(model) as ChatCompletionInputMessage[];
		snippets.push(`llm.create_chat_completion(
	messages = ${stringifyMessages(messages, { attributeKeyQuotes: true, indent: "\t" })}
)`);
	} else {
		snippets.push(`output = llm(
	"Once upon a time,",
	max_tokens=512,
	echo=True
)
print(output)`);
	}

	return snippets;
};

export const lerobot = (model: ModelData): string[] => {
	if (model.tags.includes("smolvla")) {
		const smolvlaSnippets = [
			// Installation snippet
			`# See https://github.com/huggingface/lerobot?tab=readme-ov-file#installation for more details
git clone https://github.com/huggingface/lerobot.git
cd lerobot
pip install -e .[smolvla]`,
			// Finetune snippet
			`# Launch finetuning on your dataset
python lerobot/scripts/train.py \\
--policy.path=${model.id} \\
--dataset.repo_id=lerobot/svla_so101_pickplace \\ 
--batch_size=64 \\
--steps=20000 \\
--output_dir=outputs/train/my_smolvla \\
--job_name=my_smolvla_training \\
--policy.device=cuda \\
--wandb.enable=true`,
		];
		if (model.id !== "lerobot/smolvla_base") {
			// Inference snippet (only if not base model)
			smolvlaSnippets.push(
				`# Run the policy using the record function	
python -m lerobot.record \\
  --robot.type=so101_follower \\
  --robot.port=/dev/ttyACM0 \\ # <- Use your port
  --robot.id=my_blue_follower_arm \\ # <- Use your robot id
  --robot.cameras="{ front: {type: opencv, index_or_path: 8, width: 640, height: 480, fps: 30}}" \\ # <- Use your cameras
  --dataset.single_task="Grasp a lego block and put it in the bin." \\ # <- Use the same task description you used in your dataset recording
  --dataset.repo_id=HF_USER/dataset_name \\  # <- This will be the dataset name on HF Hub
  --dataset.episode_time_s=50 \\
  --dataset.num_episodes=10 \\
  --policy.path=${model.id}`
			);
		}
		return smolvlaSnippets;
	}
	return [];
};

export const tf_keras = (model: ModelData): string[] => [
	`# Note: 'keras<3.x' or 'tf_keras' must be installed (legacy)
# See https://github.com/keras-team/tf-keras for more details.
from huggingface_hub import from_pretrained_keras

model = from_pretrained_keras("${model.id}")
`,
];

export const mamba_ssm = (model: ModelData): string[] => [
	`from mamba_ssm import MambaLMHeadModel

model = MambaLMHeadModel.from_pretrained("${model.id}")`,
];

export const mars5_tts = (model: ModelData): string[] => [
	`# Install from https://github.com/Camb-ai/MARS5-TTS

from inference import Mars5TTS
mars5 = Mars5TTS.from_pretrained("${model.id}")`,
];

export const matanyone = (model: ModelData): string[] => [
	`# Install from https://github.com/pq-yang/MatAnyone.git

from matanyone.model.matanyone import MatAnyone
model = MatAnyone.from_pretrained("${model.id}")`,
	`
from matanyone import InferenceCore
processor = InferenceCore("${model.id}")`,
];

export const mesh_anything = (): string[] => [
	`# Install from https://github.com/buaacyw/MeshAnything.git

from MeshAnything.models.meshanything import MeshAnything

# refer to https://github.com/buaacyw/MeshAnything/blob/main/main.py#L91 on how to define args
# and https://github.com/buaacyw/MeshAnything/blob/main/app.py regarding usage
model = MeshAnything(args)`,
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

export const paddleocr = (model: ModelData): string[] => {
	const mapping: Record<string, { className: string }> = {
		textline_detection: { className: "TextDetection" },
		textline_recognition: { className: "TextRecognition" },
		seal_text_detection: { className: "SealTextDetection" },
		doc_img_unwarping: { className: "TextImageUnwarping" },
		doc_img_orientation_classification: { className: "DocImgOrientationClassification" },
		textline_orientation_classification: { className: "TextLineOrientationClassification" },
		chart_parsing: { className: "ChartParsing" },
		formula_recognition: { className: "FormulaRecognition" },
		layout_detection: { className: "LayoutDetection" },
		table_cells_detection: { className: "TableCellsDetection" },
		wired_table_classification: { className: "TableClassification" },
		table_structure_recognition: { className: "TableStructureRecognition" },
	};

	if (model.tags.includes("doc_vlm")) {
		return [
			`# pip install paddleocr
from paddleocr import DocVLM
model = DocVLM(model_name="${nameWithoutNamespace(model.id)}")
output = model.predict(
    input={"image": "path/to/image.png", "query": "Parsing this image and output the content in Markdown format."},
    batch_size=1
)
for res in output:
    res.print()
    res.save_to_img(save_path="./output/")
    res.save_to_json(save_path="./output/res.json")`,
		];
	}

	for (const tag of model.tags) {
		if (tag in mapping) {
			const { className } = mapping[tag];
			return [
				`# pip install paddleocr
from paddleocr import ${className}
model = ${className}(model_name="${nameWithoutNamespace(model.id)}")
output = model.predict(input="path/to/image.png", batch_size=1)
for res in output:
    res.print()
    res.save_to_img(save_path="./output/")
    res.save_to_json(save_path="./output/res.json")`,
			];
		}
	}

	return [
		`# Please refer to the document for information on how to use the model. 
# https://paddlepaddle.github.io/PaddleOCR/latest/en/version3.x/module_usage/module_overview.html`,
	];
};

export const perception_encoder = (model: ModelData): string[] => {
	const clip_model = `# Use PE-Core models as CLIP models
import core.vision_encoder.pe as pe

model = pe.CLIP.from_config("${model.id}", pretrained=True)`;

	const vision_encoder = `# Use any PE model as a vision encoder
import core.vision_encoder.pe as pe

model = pe.VisionTransformer.from_config("${model.id}", pretrained=True)`;

	if (model.id.includes("Core")) {
		return [clip_model, vision_encoder];
	} else {
		return [vision_encoder];
	}
};
export const phantom_wan = (model: ModelData): string[] => [
	`from huggingface_hub import snapshot_download
from phantom_wan import WANI2V, configs

checkpoint_dir = snapshot_download("${model.id}")
wan_i2v = WanI2V(
            config=configs.WAN_CONFIGS['i2v-14B'],
            checkpoint_dir=checkpoint_dir,
        )
 video = wan_i2v.generate(text_prompt, image_prompt)`,
];

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
	if (model.tags.includes("pyannote-audio-pipeline")) {
		return pyannote_audio_pipeline(model);
	}
	return pyannote_audio_model(model);
};

export const relik = (model: ModelData): string[] => [
	`from relik import Relik
 
relik = Relik.from_pretrained("${model.id}")`,
];

export const renderformer = (model: ModelData): string[] => [
	`# Install from https://github.com/microsoft/renderformer

from renderformer import RenderFormerRenderingPipeline
pipeline = RenderFormerRenderingPipeline.from_pretrained("${model.id}")`,
];

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
	if (model.tags.includes("text-to-mel")) {
		return tensorflowttsTextToMel(model);
	} else if (model.tags.includes("mel-to-wav")) {
		return tensorflowttsMelToWav(model);
	}
	return tensorflowttsUnknown(model);
};

export const timm = (model: ModelData): string[] => [
	`import timm

model = timm.create_model("hf_hub:${model.id}", pretrained=True)`,
];

export const saelens = (/* model: ModelData */): string[] => [
	`# pip install sae-lens
from sae_lens import SAE

sae, cfg_dict, sparsity = SAE.from_pretrained(
    release = "RELEASE_ID", # e.g., "gpt2-small-res-jb". See other options in https://github.com/jbloomAus/SAELens/blob/main/sae_lens/pretrained_saes.yaml
    sae_id = "SAE_ID", # e.g., "blocks.8.hook_resid_pre". Won't always be a hook point
)`,
];

export const seed_story = (): string[] => [
	`# seed_story_cfg_path refers to 'https://github.com/TencentARC/SEED-Story/blob/master/configs/clm_models/agent_7b_sft.yaml'
# llm_cfg_path refers to 'https://github.com/TencentARC/SEED-Story/blob/master/configs/clm_models/llama2chat7b_lora.yaml'
from omegaconf import OmegaConf
import hydra

# load Llama2
llm_cfg = OmegaConf.load(llm_cfg_path)
llm = hydra.utils.instantiate(llm_cfg, torch_dtype="fp16")

# initialize seed_story
seed_story_cfg = OmegaConf.load(seed_story_cfg_path)
seed_story = hydra.utils.instantiate(seed_story_cfg, llm=llm) `,
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
	if (model.tags.includes("skops")) {
		const skopsmodelFile = model.config?.sklearn?.model?.file;
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

export const stable_audio_tools = (model: ModelData): string[] => [
	`import torch
import torchaudio
from einops import rearrange
from stable_audio_tools import get_pretrained_model
from stable_audio_tools.inference.generation import generate_diffusion_cond

device = "cuda" if torch.cuda.is_available() else "cpu"

# Download model
model, model_config = get_pretrained_model("${model.id}")
sample_rate = model_config["sample_rate"]
sample_size = model_config["sample_size"]

model = model.to(device)

# Set up text and timing conditioning
conditioning = [{
	"prompt": "128 BPM tech house drum loop",
}]

# Generate stereo audio
output = generate_diffusion_cond(
	model,
	conditioning=conditioning,
	sample_size=sample_size,
	device=device
)

# Rearrange audio batch to a single sequence
output = rearrange(output, "b d n -> d (b n)")

# Peak normalize, clip, convert to int16, and save to file
output = output.to(torch.float32).div(torch.max(torch.abs(output))).clamp(-1, 1).mul(32767).to(torch.int16).cpu()
torchaudio.save("output.wav", output, sample_rate)`,
];

export const fastai = (model: ModelData): string[] => [
	`from huggingface_hub import from_pretrained_fastai

learn = from_pretrained_fastai("${model.id}")`,
];

export const sam2 = (model: ModelData): string[] => {
	const image_predictor = `# Use SAM2 with images
import torch
from sam2.sam2_image_predictor import SAM2ImagePredictor

predictor = SAM2ImagePredictor.from_pretrained(${model.id})

with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
    predictor.set_image(<your_image>)
    masks, _, _ = predictor.predict(<input_prompts>)`;

	const video_predictor = `# Use SAM2 with videos
import torch
from sam2.sam2_video_predictor import SAM2VideoPredictor
	
predictor = SAM2VideoPredictor.from_pretrained(${model.id})

with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
    state = predictor.init_state(<your_video>)

    # add new prompts and instantly get the output on the same frame
    frame_idx, object_ids, masks = predictor.add_new_points(state, <your_prompts>):

    # propagate the prompts to get masklets throughout the video
    for frame_idx, object_ids, masks in predictor.propagate_in_video(state):
        ...`;
	return [image_predictor, video_predictor];
};

export const sampleFactory = (model: ModelData): string[] => [
	`python -m sample_factory.huggingface.load_from_hub -r ${model.id} -d ./train_dir`,
];

function get_widget_examples_from_st_model(model: ModelData): string[] | undefined {
	const widgetExample = model.widgetData?.[0] as WidgetExampleSentenceSimilarityInput | undefined;
	if (widgetExample?.source_sentence && widgetExample?.sentences?.length) {
		return [widgetExample.source_sentence, ...widgetExample.sentences];
	}
}

export const sentenceTransformers = (model: ModelData): string[] => {
	const remote_code_snippet = model.tags.includes(TAG_CUSTOM_CODE) ? ", trust_remote_code=True" : "";
	if (model.tags.includes("cross-encoder") || model.pipeline_tag == "text-ranking") {
		return [
			`from sentence_transformers import CrossEncoder

model = CrossEncoder("${model.id}"${remote_code_snippet})

query = "Which planet is known as the Red Planet?"
passages = [
	"Venus is often called Earth's twin because of its similar size and proximity.",
	"Mars, known for its reddish appearance, is often referred to as the Red Planet.",
	"Jupiter, the largest planet in our solar system, has a prominent red spot.",
	"Saturn, famous for its rings, is sometimes mistaken for the Red Planet."
]

scores = model.predict([(query, passage) for passage in passages])
print(scores)`,
		];
	}

	const exampleSentences = get_widget_examples_from_st_model(model) ?? [
		"The weather is lovely today.",
		"It's so sunny outside!",
		"He drove to the stadium.",
	];

	return [
		`from sentence_transformers import SentenceTransformer

model = SentenceTransformer("${model.id}"${remote_code_snippet})

sentences = ${JSON.stringify(exampleSentences, null, 4)}
embeddings = model.encode(sentences)

similarities = model.similarity(embeddings, embeddings)
print(similarities.shape)
# [${exampleSentences.length}, ${exampleSentences.length}]`,
	];
};

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
	const speechbrainInterface = model.config?.speechbrain?.speechbrain_interface;
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

export const terratorch = (model: ModelData): string[] => [
	`from terratorch.registry import BACKBONE_REGISTRY

model = BACKBONE_REGISTRY.build("${model.id}")`,
];

export const transformers = (model: ModelData): string[] => {
	const info = model.transformersInfo;
	if (!info) {
		return [`# ⚠️ Type of model unknown`];
	}
	const remote_code_snippet = model.tags.includes(TAG_CUSTOM_CODE) ? ", trust_remote_code=True" : "";

	const autoSnippet = [];
	if (info.processor) {
		const processorVarName =
			info.processor === "AutoTokenizer"
				? "tokenizer"
				: info.processor === "AutoFeatureExtractor"
				  ? "extractor"
				  : "processor";
		autoSnippet.push(
			"# Load model directly",
			`from transformers import ${info.processor}, ${info.auto_model}`,
			"",
			`${processorVarName} = ${info.processor}.from_pretrained("${model.id}"` + remote_code_snippet + ")",
			`model = ${info.auto_model}.from_pretrained("${model.id}"` + remote_code_snippet + ")"
		);
		if (model.tags.includes("conversational")) {
			if (model.tags.includes("image-text-to-text")) {
				autoSnippet.push(
					"messages = [",
					[
						"    {",
						'        "role": "user",',
						'        "content": [',
						'            {"type": "image", "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/p-blog/candy.JPG"},',
						'            {"type": "text", "text": "What animal is on the candy?"}',
						"        ]",
						"    },",
					].join("\n"),
					"]"
				);
			} else {
				autoSnippet.push("messages = [", '    {"role": "user", "content": "Who are you?"},', "]");
			}
			autoSnippet.push(
				`inputs = ${processorVarName}.apply_chat_template(`,
				"	messages,",
				"	add_generation_prompt=True,",
				"	tokenize=True,",
				"	return_dict=True,",
				'	return_tensors="pt",',
				").to(model.device)",
				"",
				"outputs = model.generate(**inputs, max_new_tokens=40)",
				`print(${processorVarName}.decode(outputs[0][inputs["input_ids"].shape[-1]:]))`
			);
		}
	} else {
		autoSnippet.push(
			"# Load model directly",
			`from transformers import ${info.auto_model}`,
			`model = ${info.auto_model}.from_pretrained("${model.id}"` + remote_code_snippet + ', torch_dtype="auto"),'
		);
	}

	if (model.pipeline_tag && LIBRARY_TASK_MAPPING.transformers?.includes(model.pipeline_tag)) {
		const pipelineSnippet = [
			"# Use a pipeline as a high-level helper",
			"from transformers import pipeline",
			"",
			`pipe = pipeline("${model.pipeline_tag}", model="${model.id}"` + remote_code_snippet + ")",
		];

		if (model.tags.includes("conversational")) {
			if (model.tags.includes("image-text-to-text")) {
				pipelineSnippet.push(
					"messages = [",
					[
						"    {",
						'        "role": "user",',
						'        "content": [',
						'            {"type": "image", "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/p-blog/candy.JPG"},',
						'            {"type": "text", "text": "What animal is on the candy?"}',
						"        ]",
						"    },",
					].join("\n"),
					"]"
				);
				pipelineSnippet.push("pipe(text=messages)");
			} else {
				pipelineSnippet.push("messages = [", '    {"role": "user", "content": "Who are you?"},', "]");
				pipelineSnippet.push("pipe(messages)");
			}
		} else if (model.pipeline_tag === "zero-shot-image-classification") {
			pipelineSnippet.push(
				"pipe(",
				'    "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/hub/parrots.png",',
				'    candidate_labels=["animals", "humans", "landscape"],',
				")"
			);
		} else if (model.pipeline_tag === "image-classification") {
			pipelineSnippet.push(
				'pipe("https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/hub/parrots.png")'
			);
		}

		return [pipelineSnippet.join("\n"), autoSnippet.join("\n")];
	}
	return [autoSnippet.join("\n")];
};

export const transformersJS = (model: ModelData): string[] => {
	if (!model.pipeline_tag) {
		return [`// ⚠️ Unknown pipeline tag`];
	}

	const libName = "@huggingface/transformers";

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
	const { base_model_name_or_path: peftBaseModel, task_type: peftTaskType } = model.config?.peft ?? {};
	const pefttask = peftTask(peftTaskType);
	if (!pefttask) {
		return [`Task type is invalid.`];
	}
	if (!peftBaseModel) {
		return [`Base model is not found.`];
	}

	return [
		`from peft import PeftModel
from transformers import AutoModelFor${pefttask}

base_model = AutoModelFor${pefttask}.from_pretrained("${peftBaseModel}")
model = PeftModel.from_pretrained(base_model, "${model.id}")`,
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

export const sana = (model: ModelData): string[] => [
	`
# Load the model and infer image from text
import torch
from app.sana_pipeline import SanaPipeline
from torchvision.utils import save_image

sana = SanaPipeline("configs/sana_config/1024ms/Sana_1600M_img1024.yaml")
sana.from_pretrained("hf://${model.id}")

image = sana(
    prompt='a cyberpunk cat with a neon sign that says "Sana"',
    height=1024,
    width=1024,
    guidance_scale=5.0,
    pag_guidance_scale=2.0,
    num_inference_steps=18,
) `,
];

export const videoprism = (model: ModelData): string[] => [
	`# Install from https://github.com/google-deepmind/videoprism
import jax
from videoprism import models as vp

flax_model = vp.get_model("${model.id}")
loaded_state = vp.load_pretrained_weights("${model.id}")

@jax.jit
def forward_fn(inputs, train=False):
  return flax_model.apply(loaded_state, inputs, train=train)`,
];

export const vfimamba = (model: ModelData): string[] => [
	`from Trainer_finetune import Model

model = Model.from_pretrained("${model.id}")`,
];

export const voicecraft = (model: ModelData): string[] => [
	`from voicecraft import VoiceCraft

model = VoiceCraft.from_pretrained("${model.id}")`,
];

export const vui = (): string[] => [
	`# !pip install git+https://github.com/fluxions-ai/vui

import torchaudio

from vui.inference import render
from vui.model import Vui,

model = Vui.from_pretrained().cuda()
waveform = render(
    model,
    "Hey, here is some random stuff, usually something quite long as the shorter the text the less likely the model can cope!",
)
print(waveform.shape)
torchaudio.save("out.opus", waveform[0], 22050)
`,
];

export const chattts = (): string[] => [
	`import ChatTTS
import torchaudio

chat = ChatTTS.Chat()
chat.load_models(compile=False) # Set to True for better performance

texts = ["PUT YOUR TEXT HERE",]

wavs = chat.infer(texts, )

torchaudio.save("output1.wav", torch.from_numpy(wavs[0]), 24000)`,
];

export const ultralytics = (model: ModelData): string[] => {
	// ultralytics models must have a version tag (e.g. `yolov8`)
	const versionTag = model.tags.find((tag) => tag.match(/^yolov\d+$/));

	const className = versionTag ? `YOLOv${versionTag.slice(4)}` : "YOLOvXX";
	const prefix = versionTag
		? ""
		: `# Couldn't find a valid YOLO version tag.\n# Replace XX with the correct version.\n`;

	return [
		prefix +
			`from ultralytics import ${className}

model = ${className}.from_pretrained("${model.id}")
source = 'http://images.cocodataset.org/val2017/000000039769.jpg'
model.predict(source=source, save=True)`,
	];
};

export const birefnet = (model: ModelData): string[] => [
	`# Option 1: use with transformers

from transformers import AutoModelForImageSegmentation
birefnet = AutoModelForImageSegmentation.from_pretrained("${model.id}", trust_remote_code=True)
`,
	`# Option 2: use with BiRefNet

# Install from https://github.com/ZhengPeng7/BiRefNet

from models.birefnet import BiRefNet
model = BiRefNet.from_pretrained("${model.id}")`,
];

export const swarmformer = (model: ModelData): string[] => [
	`from swarmformer import SwarmFormerModel

model = SwarmFormerModel.from_pretrained("${model.id}")
`,
];

export const univa = (model: ModelData): string[] => [
	`# Follow installation instructions at https://github.com/PKU-YuanGroup/UniWorld-V1

from univa.models.qwen2p5vl.modeling_univa_qwen2p5vl import UnivaQwen2p5VLForConditionalGeneration
	model = UnivaQwen2p5VLForConditionalGeneration.from_pretrained(
        "${model.id}",
        torch_dtype=torch.bfloat16,
        attn_implementation="flash_attention_2",
    ).to("cuda")
	processor = AutoProcessor.from_pretrained("${model.id}")
`,
];

const mlx_unknown = (model: ModelData): string[] => [
	`# Download the model from the Hub
pip install huggingface_hub[hf_xet]

huggingface-cli download --local-dir ${nameWithoutNamespace(model.id)} ${model.id}`,
];

const mlxlm = (model: ModelData): string[] => [
	`# Make sure mlx-lm is installed
# pip install --upgrade mlx-lm
# if on a CUDA device, also pip install mlx[cuda]

# Generate text with mlx-lm
from mlx_lm import load, generate

model, tokenizer = load("${model.id}")

prompt = "Once upon a time in"
text = generate(model, tokenizer, prompt=prompt, verbose=True)`,
];

const mlxchat = (model: ModelData): string[] => [
	`# Make sure mlx-lm is installed
# pip install --upgrade mlx-lm

# Generate text with mlx-lm
from mlx_lm import load, generate

model, tokenizer = load("${model.id}")

prompt = "Write a story about Einstein"
messages = [{"role": "user", "content": prompt}]
prompt = tokenizer.apply_chat_template(
    messages, add_generation_prompt=True
)

text = generate(model, tokenizer, prompt=prompt, verbose=True)`,
];

const mlxvlm = (model: ModelData): string[] => [
	`# Make sure mlx-vlm is installed
# pip install --upgrade mlx-vlm

from mlx_vlm import load, generate
from mlx_vlm.prompt_utils import apply_chat_template
from mlx_vlm.utils import load_config

# Load the model
model, processor = load("${model.id}")
config = load_config("${model.id}")

# Prepare input
image = ["http://images.cocodataset.org/val2017/000000039769.jpg"]
prompt = "Describe this image."

# Apply chat template
formatted_prompt = apply_chat_template(
    processor, config, prompt, num_images=1
)

# Generate output
output = generate(model, processor, formatted_prompt, image)
print(output)`,
];

export const mlxim = (model: ModelData): string[] => [
	`from mlxim.model import create_model

model = create_model(${model.id})`,
];

export const mlx = (model: ModelData): string[] => {
	if (model.pipeline_tag === "image-text-to-text") {
		return mlxvlm(model);
	}
	if (model.pipeline_tag === "text-generation") {
		if (model.tags.includes("conversational")) {
			return mlxchat(model);
		} else {
			return mlxlm(model);
		}
	}
	return mlx_unknown(model);
};

export const model2vec = (model: ModelData): string[] => [
	`from model2vec import StaticModel

model = StaticModel.from_pretrained("${model.id}")`,
];

export const nemo = (model: ModelData): string[] => {
	let command: string[] | undefined = undefined;
	// Resolve the tag to a nemo domain/sub-domain
	if (model.tags.includes("automatic-speech-recognition")) {
		command = nemoDomainResolver("ASR", model);
	}

	return command ?? [`# tag did not correspond to a valid NeMo domain.`];
};

export const outetts = (model: ModelData): string[] => {
	// Don’t show this block on GGUF / ONNX mirrors
	const t = model.tags ?? [];
	if (t.includes("gguf") || t.includes("onnx")) return [];

	// v1.0 HF → minimal runnable snippet
	return [
		`
  import outetts
  
  enum = outetts.Models("${model.id}".split("/", 1)[1])       # VERSION_1_0_SIZE_1B
  cfg  = outetts.ModelConfig.auto_config(enum, outetts.Backend.HF)
  tts  = outetts.Interface(cfg)
  
  speaker = tts.load_default_speaker("EN-FEMALE-1-NEUTRAL")
  tts.generate(
	  outetts.GenerationConfig(
		  text="Hello there, how are you doing?",
		  speaker=speaker,
	  )
  ).save("output.wav")
  `,
	];
};

export const pxia = (model: ModelData): string[] => [
	`from pxia import AutoModel

model = AutoModel.from_pretrained("${model.id}")`,
];

export const pythae = (model: ModelData): string[] => [
	`from pythae.models import AutoModel

model = AutoModel.load_from_hf_hub("${model.id}")`,
];

const musicgen = (model: ModelData): string[] => [
	`from audiocraft.models import MusicGen

model = MusicGen.get_pretrained("${model.id}")

descriptions = ['happy rock', 'energetic EDM', 'sad jazz']
wav = model.generate(descriptions)  # generates 3 samples.`,
];

const magnet = (model: ModelData): string[] => [
	`from audiocraft.models import MAGNeT
	
model = MAGNeT.get_pretrained("${model.id}")

descriptions = ['disco beat', 'energetic EDM', 'funky groove']
wav = model.generate(descriptions)  # generates 3 samples.`,
];

const audiogen = (model: ModelData): string[] => [
	`from audiocraft.models import AudioGen
	
model = AudioGen.get_pretrained("${model.id}")
model.set_generation_params(duration=5)  # generate 5 seconds.
descriptions = ['dog barking', 'sirene of an emergency vehicle', 'footsteps in a corridor']
wav = model.generate(descriptions)  # generates 3 samples.`,
];
export const anemoi = (model: ModelData): string[] => [
	`from anemoi.inference.runners.default import DefaultRunner
from anemoi.inference.config.run import RunConfiguration
# Create Configuration
config = RunConfiguration(checkpoint = {"huggingface":"${model.id}"})
# Load Runner
runner = DefaultRunner(config)`,
];

export const audiocraft = (model: ModelData): string[] => {
	if (model.tags.includes("musicgen")) {
		return musicgen(model);
	} else if (model.tags.includes("audiogen")) {
		return audiogen(model);
	} else if (model.tags.includes("magnet")) {
		return magnet(model);
	} else {
		return [`# Type of model unknown.`];
	}
};

export const whisperkit = (): string[] => [
	`# Install CLI with Homebrew on macOS device
brew install whisperkit-cli

# View all available inference options
whisperkit-cli transcribe --help
	
# Download and run inference using whisper base model
whisperkit-cli transcribe --audio-path /path/to/audio.mp3

# Or use your preferred model variant
whisperkit-cli transcribe --model "large-v3" --model-prefix "distil" --audio-path /path/to/audio.mp3 --verbose`,
];

export const threedtopia_xl = (model: ModelData): string[] => [
	`from threedtopia_xl.models import threedtopia_xl

model = threedtopia_xl.from_pretrained("${model.id}")
model.generate(cond="path/to/image.png")`,
];

export const hezar = (model: ModelData): string[] => [
	`from hezar import Model

model = Model.load("${model.id}")`,
];

export const zonos = (model: ModelData): string[] => [
	`# pip install git+https://github.com/Zyphra/Zonos.git
import torchaudio
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict

model = Zonos.from_pretrained("${model.id}", device="cuda")

wav, sr = torchaudio.load("speaker.wav")           # 5-10s reference clip
speaker = model.make_speaker_embedding(wav, sr)

cond  = make_cond_dict(text="Hello, world!", speaker=speaker, language="en-us")
codes = model.generate(model.prepare_conditioning(cond))

audio = model.autoencoder.decode(codes)[0].cpu()
torchaudio.save("sample.wav", audio, model.autoencoder.sampling_rate)
`,
];

//#endregion
