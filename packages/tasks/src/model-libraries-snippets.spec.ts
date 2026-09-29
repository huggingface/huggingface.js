import { describe, expect, it } from "vitest";
import type { ModelData } from "./model-data.js";
import {
	adapters,
	cartesia_pytorch,
	depth_anything_v2,
	describe_anything,
	diffusers,
	diffusionkit,
	gliner2,
	indextts,
	keras_hub,
	kernels,
	kimi_audio,
	litert_lm,
	llama_cpp_python,
	mlAgents,
	mlxim,
	multimolecule,
	paddlenlp,
	peft,
	phantom_wan,
	pruna,
	sam2,
	sam_3d_body,
	sentenceTransformers,
	sklearn,
	speechbrain,
	timm,
	transformers,
	transformersJS,
	ultralytics,
	vui,
} from "./model-libraries-snippets.js";

describe("model-libraries-snippets", () => {
	it("llama_cpp_python conversational", async () => {
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			pipeline_tag: "text-generation",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = llama_cpp_python(model);

		expect(snippet.join("\n")).toEqual(`# !pip install llama-cpp-python

from llama_cpp import Llama

llm = Llama.from_pretrained(
	repo_id="bartowski/Llama-3.2-3B-Instruct-GGUF",
	filename="{{GGUF_FILE}}",
)

llm.create_chat_completion(
	messages = [
		{
			"role": "user",
			"content": "What is the capital of France?"
		}
	]
)`);
	});

	it("llama_cpp_python non-conversational", async () => {
		const model: ModelData = {
			id: "mlabonne/gemma-2b-GGUF",
			tags: [""],
			inference: "",
		};
		const snippet = llama_cpp_python(model);

		expect(snippet.join("\n")).toEqual(`# !pip install llama-cpp-python

from llama_cpp import Llama

llm = Llama.from_pretrained(
	repo_id="mlabonne/gemma-2b-GGUF",
	filename="{{GGUF_FILE}}",
)

output = llm(
	"Once upon a time,",
	max_tokens=512,
	echo=True
)
print(output)`);
	});

	// a repo owner can put anything in config.json / the model card, so every interpolated value
	// must either be escaped (string literals) or rejected (bare identifiers)
	describe("repo-controlled values are not injectable", () => {
		const PAYLOAD = `")\nimport os; os.system("id`;

		it.each([
			["adapters", adapters, { config: { adapter_transformers: { model_name: PAYLOAD } } }],
			["diffusers", diffusers, { tags: ["lora"], cardData: { base_model: PAYLOAD, instance_prompt: PAYLOAD } }],
			["keras_hub", keras_hub, { config: { keras_hub: { tasks: [PAYLOAD, "TextClassifier"] } } }],
			["paddlenlp", paddlenlp, { config: { architectures: [PAYLOAD] } }],
			["peft", peft, { config: { peft: { base_model_name_or_path: PAYLOAD, task_type: "CAUSAL_LM" } } }],
			["multimolecule", multimolecule, { widgetData: [{ text: PAYLOAD }] }],
			["transformers", transformers, { transformersInfo: { auto_model: PAYLOAD, processor: "AutoTokenizer" } }],
			[
				"sklearn",
				sklearn,
				{ tags: ["skops"], config: { sklearn: { model: { file: PAYLOAD }, model_format: "pickle" } } },
			],
		])("%s", (_name, snippetFn, model) => {
			const snippet = snippetFn({ id: "user/model", tags: [], inference: "", ...model } as ModelData).join("\n");

			expect(snippet).not.toContain(PAYLOAD);
		});

		it("keras_hub keeps the valid task next to a rejected one", () => {
			const model = {
				id: "user/model",
				tags: [],
				inference: "",
				config: { keras_hub: { tasks: [PAYLOAD, "TextClassifier"] } },
			};
			expect(keras_hub(model as ModelData).join("\n")).toContain("keras_hub.models.TextClassifier.from_preset");
		});
	});

	describe("snippets stay runnable for the common repo shapes", () => {
		const base = { id: "user/model", tags: [] as string[], inference: "" };

		it("transformers: the chat example needs a chat template, not only the conversational tag", () => {
			const chatModel = {
				...base,
				pipeline_tag: "text-generation",
				tags: ["conversational"],
				transformersInfo: { auto_model: "AutoModelForCausalLM", processor: "AutoTokenizer" },
			} as ModelData;
			const [pipelineWithoutTemplate] = transformers(chatModel);
			expect(pipelineWithoutTemplate).not.toContain("messages");

			const [pipelineSnippet, autoSnippet] = transformers({
				...chatModel,
				config: { tokenizer_config: { chat_template: "{{ messages }}" } },
			} as ModelData);
			expect(pipelineSnippet).toContain("pipe(messages)");
			expect(autoSnippet).toContain("max_new_tokens=256");
			expect(autoSnippet).toContain("# pip install -U transformers accelerate");
		});

		it("transformers: pipelines removed in v5 get a warning with a valid pip command", () => {
			const [snippet] = transformers({
				...base,
				pipeline_tag: "question-answering",
				transformersInfo: { auto_model: "AutoModelForQuestionAnswering", processor: "AutoTokenizer" },
			} as ModelData);
			expect(snippet).toContain("no longer supported in transformers v5");
			expect(snippet).toContain(`# pip install "transformers<5.0.0"`);
		});

		it("sentence-transformers: rerankers tagged text-classification use CrossEncoder", () => {
			const [reranker] = sentenceTransformers({
				...base,
				pipeline_tag: "text-classification",
				config: { architectures: ["XLMRobertaForSequenceClassification"] },
			} as ModelData);
			expect(reranker).toContain("CrossEncoder(");

			const [biEncoder] = sentenceTransformers({
				...base,
				pipeline_tag: "sentence-similarity",
				config: { architectures: ["BertModel"] },
			} as ModelData);
			expect(biEncoder).toContain("SentenceTransformer(");

			// SetFit bi-encoders can carry a *ForSequenceClassification config too (e.g. NW-temp/previous-best-my-awesome-setfit-model)
			const [setfitModel] = sentenceTransformers({
				...base,
				tags: ["setfit"],
				pipeline_tag: "text-classification",
				config: { architectures: ["DistilBertForSequenceClassification"] },
			} as ModelData);
			expect(setfitModel).not.toContain("CrossEncoder(");
		});

		it("sentence-transformers: sparse encoders use SparseEncoder", () => {
			const [snippet] = sentenceTransformers({ ...base, tags: ["sparse-encoder"] } as ModelData);
			expect(snippet).toContain("SparseEncoder(");
			expect(snippet).toContain("encode_query(");
		});

		it("diffusers: prefixed pipeline class tags reach the dedicated branches", () => {
			const inpainting = diffusers({ ...base, tags: ["diffusers:StableDiffusionInpaintPipeline"] } as ModelData);
			expect(inpainting.join("\n")).toContain("AutoPipelineForInpainting");
			// several inpainting repos only ship non-variant weights
			expect(inpainting.join("\n")).not.toContain('variant="fp16"');

			const fluxFill = diffusers({ ...base, config: { diffusers: { _class_name: "FluxFillPipeline" } } } as ModelData);
			expect(fluxFill.join("\n")).toContain("FluxFillPipeline");
		});

		it("diffusers: the first base model is used when several are listed", () => {
			const snippet = diffusers({
				...base,
				tags: ["lora"],
				cardData: { base_model: ["org/base", "org/base-turbo"] },
			} as ModelData).join("\n");
			expect(snippet).toContain(`"org/base"`);
			expect(snippet).not.toContain("org/base,org/base-turbo");
		});

		it("diffusers: a listed Diffusers conversion is preferred over the original checkpoint", () => {
			// e.g. Remade-AI/Rotate: only the -Diffusers repo has a model_index.json
			const snippet = diffusers({
				...base,
				tags: ["lora"],
				pipeline_tag: "image-to-video",
				cardData: { base_model: ["Wan-AI/Wan2.1-I2V-14B-480P", "Wan-AI/Wan2.1-I2V-14B-480P-Diffusers"] },
			} as ModelData).join("\n");
			expect(snippet).toContain(`DiffusionPipeline.from_pretrained("Wan-AI/Wan2.1-I2V-14B-480P-Diffusers"`);
		});

		it("diffusers: LoRA image-to-video exports the generated frames", () => {
			const snippet = diffusers({
				...base,
				tags: ["lora"],
				pipeline_tag: "image-to-video",
				cardData: { base_model: "org/base" },
			} as ModelData).join("\n");
			expect(snippet).toContain("output = pipe(");
			expect(snippet).toContain(`export_to_video(output, "output.mp4")`);
		});

		it("transformers.js: Hub tasks without a pipeline() task of the same name are mapped", () => {
			expect(transformersJS({ ...base, pipeline_tag: "sentence-similarity" } as ModelData)[0]).toContain(
				"pipeline('feature-extraction'",
			);
			expect(transformersJS({ ...base, pipeline_tag: "fill-mask" } as ModelData)[0]).toContain("pipeline('fill-mask'");
		});

		it("transformers.js: rerankers score query/document pairs instead of using the text-classification pipeline", () => {
			// the text-classification pipeline takes no text pairs and softmaxes a single logit, so every score is 1
			const [snippet] = transformersJS({ ...base, pipeline_tag: "text-ranking" } as ModelData);
			expect(snippet).not.toContain("pipeline(");
			expect(snippet).toContain("AutoModelForSequenceClassification.from_pretrained('user/model')");
			expect(snippet).toContain("text_pair: documents");
			expect(snippet).toContain("logits.sigmoid()");
		});

		it("peft: every PEFT task type has a loader", () => {
			const adapter = (task_type: string) =>
				({ ...base, config: { peft: { base_model_name_or_path: "org/base", task_type } } }) as ModelData;
			expect(peft(adapter("FEATURE_EXTRACTION"))[0]).toContain("AutoModel.from_pretrained");
			expect(peft(adapter("QUESTION_ANS"))[0]).toContain("AutoModelForQuestionAnswering");
			expect(peft(adapter("CAUSAL_LM"))[0]).toContain("AutoModelForCausalLM");
			expect(peft(adapter("UNKNOWN"))[0]).toEqual("Task type is invalid.");
		});

		it("peft: speech seq2seq adapters use the speech auto class", () => {
			const whisper = peft({
				...base,
				config: { peft: { base_model_name_or_path: "openai/whisper-large-v3", task_type: "SEQ_2_SEQ_LM" } },
			} as ModelData)[0];
			expect(whisper).toContain("AutoModelForSpeechSeq2Seq");
			for (const baseId of [
				"facebook/s2t-small-librispeech-asr",
				"facebook/seamless-m4t-v2-large",
				"microsoft/speecht5_asr",
			]) {
				expect(
					peft({
						...base,
						config: { peft: { base_model_name_or_path: baseId, task_type: "SEQ_2_SEQ_LM" } },
					} as ModelData)[0],
				).toContain("AutoModelForSpeechSeq2Seq");
			}

			const t5 = peft({
				...base,
				config: { peft: { base_model_name_or_path: "google/flan-t5-base", task_type: "SEQ_2_SEQ_LM" } },
			} as ModelData)[0];
			expect(t5).toContain("AutoModelForSeq2SeqLM");

			// audio models that transformers registers under the text seq2seq class must not be overridden
			const qwenAudio = peft({
				...base,
				pipeline_tag: "automatic-speech-recognition",
				config: { peft: { base_model_name_or_path: "Qwen/Qwen2-Audio-7B", task_type: "SEQ_2_SEQ_LM" } },
			} as ModelData)[0];
			expect(qwenAudio).toContain("AutoModelForSeq2SeqLM");
		});

		it("peft: multi-task speech bases only get the speech class for speech-to-text adapters", () => {
			const adapter = (baseId: string, extra: Partial<ModelData> = {}) =>
				peft({
					...base,
					...extra,
					config: { peft: { base_model_name_or_path: baseId, task_type: "SEQ_2_SEQ_LM" } },
				} as ModelData)[0];

			// SeamlessM4T text translation adapters need the text-to-text head (e.g. maxbsdv/LEO-SeamlessM4T-v2-Large-Roverplastik)
			expect(adapter("facebook/seamless-m4t-v2-large", { pipeline_tag: "translation" })).toContain(
				"AutoModelForSeq2SeqLM",
			);
			expect(adapter("facebook/seamless-m4t-v2-large", { tags: ["translation"] })).toContain("AutoModelForSeq2SeqLM");
			// speech adapters, tagged or not, keep the speech-to-text head
			expect(adapter("facebook/seamless-m4t-v2-large", { tags: ["speech-translation"] })).toContain(
				"AutoModelForSpeechSeq2Seq",
			);

			// SpeechT5 text-to-speech bases must not silently load the speech-to-text head
			expect(adapter("microsoft/speecht5_tts")).not.toContain("AutoModelForSpeechSeq2Seq");
			expect(adapter("user/speecht5_finetuned_voxpopuli_nl")).not.toContain("AutoModelForSpeechSeq2Seq");
			expect(adapter("user/speecht5_tts_basrah_dialect")).not.toContain("AutoModelForSpeechSeq2Seq");
			expect(
				adapter("user/speecht5_finetuned_librispeech", { pipeline_tag: "automatic-speech-recognition" }),
			).toContain("AutoModelForSpeechSeq2Seq");
		});

		it("peft: falls back to the model card's base model", () => {
			const snippet = peft({
				...base,
				cardData: { base_model: "org/base" },
				config: { peft: { task_type: "CAUSAL_LM" } },
			} as ModelData)[0];
			expect(snippet).toContain(`"org/base"`);
		});

		it("ultralytics: mainline loads weights with YOLO(), the yolov10 fork keeps its own loader", () => {
			expect(ultralytics(base as ModelData)[0]).toContain("model = YOLO(weights)");
			expect(ultralytics({ ...base, tags: ["yolov10", "safetensors"] } as ModelData)[0]).toContain(
				"YOLOv10.from_pretrained",
			);
			expect(
				ultralytics({ ...base, library_name: "yolov10", tags: ["yolov10", "safetensors"] } as ModelData)[0],
			).toContain("YOLOv10.from_pretrained");
		});

		it("ultralytics: yolov10 fork repos that only ship .pt weights load them with YOLOv10()", () => {
			// e.g. kadirnar/Yolov10: from_pretrained needs the config.json and model.safetensors of a fork push
			const [snippet] = ultralytics({ ...base, library_name: "yolov10", tags: ["yolov10"] } as ModelData);
			expect(snippet).toContain("model = YOLOv10(weights)");
			expect(snippet).not.toContain("from_pretrained");
		});

		it("ultralytics: mainline repos listing a yolov10 tag stay on the mainline loader", () => {
			// e.g. Ultralytics/YOLOv8 is tagged yolov3 ... yolov10 but only ships .pt files for mainline YOLO()
			const versionTags = ["ultralytics", "yolov8", "yolov9", "yolov10"];
			for (const model of [
				{ ...base, library_name: "ultralytics", tags: versionTags },
				{ ...base, tags: versionTags },
			]) {
				const [snippet] = ultralytics(model as ModelData);
				expect(snippet).toContain("model = YOLO(weights)");
				expect(snippet).not.toContain("YOLOv10");
			}
		});

		it("ultralytics: fork pushes tagged ultralytics keep the yolov10 loader", () => {
			// e.g. kairess/baby-face-detection-yolov10: library ultralytics, but only the fork's model.safetensors
			const [snippet] = ultralytics({
				...base,
				library_name: "ultralytics",
				tags: ["ultralytics", "safetensors", "yolov10"],
			} as ModelData);
			expect(snippet).toContain("YOLOv10.from_pretrained");
		});

		it("pruna: the pro variant never rewrites the repo id", () => {
			const snippet = pruna({ ...base, id: "pruna-test/model", tags: ["pruna_pro-ai"] } as ModelData).join("\n");
			expect(snippet).toContain("from pruna_pro import PrunaProModel");
			expect(snippet).toContain(`"pruna-test/model"`);
			expect(snippet).not.toContain("pruna_pro-test");
		});

		it("sklearn: joblib repos use the filename declared in config.json", () => {
			expect(sklearn({ ...base, config: { sklearn: { model: { file: "model.pkl" } } } } as ModelData)[0]).toContain(
				`"model.pkl"`,
			);
			expect(sklearn(base as ModelData)[0]).toContain(`"sklearn_model.joblib"`);
			// a declared name that is not a pickle (typo'd in e.g. danupurnomo/dummy-titanic) falls back to the default
			expect(
				sklearn({ ...base, config: { sklearn: { model: { file: "sklean_model.jpblib" } } } } as ModelData)[0],
			).toContain(`"sklearn_model.joblib"`);
		});

		it("sklearn: skops repos download with huggingface_hub", () => {
			// skops.hub_utils was removed in skops 0.12
			const skops = (sklearnConfig: Record<string, unknown>) =>
				sklearn({ ...base, tags: ["skops"], config: { sklearn: sklearnConfig } } as ModelData)[0];

			const skopsFile = skops({ model: { file: "model.skops" }, model_format: "skops" });
			expect(skopsFile).toContain(`model = load(hf_hub_download("user/model", "model.skops"))`);
			expect(skopsFile).not.toContain("hub_utils");

			const pickled = skops({ model: { file: "model.pkl" }, model_format: "pickle" });
			expect(pickled).toContain(`joblib.load(\n\thf_hub_download("user/model", "model.pkl")`);
			expect(pickled).not.toContain("hub_utils");

			// a pickled file without a declared model_format (e.g. julien-c/skops-digits) is not read with skops.io
			const undeclared = skops({ model: { file: "sklearn_model.joblib" } });
			expect(undeclared).toContain("joblib.load(");
			expect(undeclared).not.toContain("skops.io");
		});

		it("speechbrain: speaker verification compares two recordings", () => {
			const [snippet] = speechbrain({
				...base,
				config: { speechbrain: { speechbrain_interface: "SpeakerRecognition" } },
			} as ModelData);
			expect(snippet).toContain(`verify_files("speaker1.wav", "speaker2.wav")`);
		});

		it("repo ids are quoted in generated Python", () => {
			const model = { ...base, id: "org/some-model" } as ModelData;
			for (const snippetFn of [sam2, sam_3d_body, mlxim, indextts, describe_anything, diffusionkit, phantom_wan]) {
				for (const snippet of snippetFn(model)) {
					expect(snippet).not.toMatch(/[(=,]\s*org\/some-model/);
				}
			}
		});

		it("mlx-image: create_model receives the registry name, not the repo id", () => {
			const [snippet] = mlxim({ ...base, id: "mlx-vision/vit_small_patch16_224.dinov3-mlxim" } as ModelData);
			expect(snippet).toContain(`create_model("vit_small_patch16_224.dinov3")`);
		});

		it("litert-lm: the command runs as pasted, without a placeholder file argument", () => {
			// litert-lm picks the repo's .litertlm file itself; an unedited `<file>` would be read by the shell as a redirection
			const [snippet] = litert_lm(base as ModelData);
			expect(snippet).toContain("--from-huggingface-repo=user/model \\\n");
			expect(snippet.slice(snippet.indexOf("litert-lm run"))).not.toMatch(/[<>]/);
		});

		it("static templates no longer carry typos", () => {
			expect(mlAgents(base as ModelData)[0]).toContain(`--local-dir="./downloads"`);
			expect(timm(base as ModelData)[0]).toContain(`"hf-hub:user/model"`);
			expect(kernels(base as ModelData)[0]).toContain(`get_kernel("user/model", version=1)`);
			expect(gliner2(base as ModelData)[0]).toContain("extractor = AutoExtractor.from_pretrained");
			expect(cartesia_pytorch(base as ModelData)[0].trimEnd()).toMatch(/print\(out_message\)$/);
			expect(vui()[0]).toContain("from vui.legacy import Vui, render\n");
			expect(phantom_wan(base as ModelData)[0]).toContain('Image.open("path/to/image.jpg")');
		});

		it("templates run as pasted", () => {
			expect(sam2(base as ModelData)[1]).toContain("predictor.add_new_points(state, <your_prompts>)\n");
			expect(depth_anything_v2(base as ModelData)[0]).toContain("model.load_state_dict(state_dict)\nmodel.eval()");
			const [sam3dBody] = sam_3d_body(base as ModelData);
			expect(sam3dBody).toContain("from tools.vis_utils import visualize_sample_together");
			expect(sam3dBody).toContain('img_bgr = cv2.imread("path/to/image.jpg")');
			expect(kimi_audio(base as ModelData)[0]).toContain(`"transformers<5"`);
			const [cartesia] = cartesia_pytorch(base as ModelData);
			expect(cartesia).toContain("from cartesia_pytorch.Rene import ReneLMHeadModel");
			expect(cartesia).toContain(`.from_pretrained("user/model").half().cuda()`);
		});
	});
});
