import { describe, expect, it } from "vitest";
import type { ModelData } from "./model-data.js";
import {
	adapters,
	cartesia_pytorch,
	describe_anything,
	diffusers,
	diffusionkit,
	gliner2,
	indextts,
	keras_hub,
	kernels,
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
			expect(transformersJS({ ...base, pipeline_tag: "text-ranking" } as ModelData)[0]).toContain(
				"pipeline('text-classification'",
			);
			expect(transformersJS({ ...base, pipeline_tag: "fill-mask" } as ModelData)[0]).toContain("pipeline('fill-mask'");
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
			expect(ultralytics({ ...base, tags: ["yolov10"] } as ModelData)[0]).toContain("YOLOv10.from_pretrained");
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

		it("static templates no longer carry typos", () => {
			expect(mlAgents(base as ModelData)[0]).toContain(`--local-dir="./downloads"`);
			expect(timm(base as ModelData)[0]).toContain(`"hf-hub:user/model"`);
			expect(kernels(base as ModelData)[0]).toContain(`get_kernel("user/model", version=1)`);
			expect(gliner2(base as ModelData)[0]).toContain("extractor = GLiNER2.from_pretrained");
			expect(cartesia_pytorch(base as ModelData)[0].trimEnd()).toMatch(/print\(out_message\)$/);
			expect(vui()[0]).toContain("from vui.model import Vui\n");
			expect(phantom_wan(base as ModelData)[0]).toContain('Image.open("path/to/image.jpg")');
		});
	});
});
