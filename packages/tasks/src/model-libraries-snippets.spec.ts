import { describe, expect, it } from "vitest";
import type { ModelData } from "./model-data.js";
import {
	adapters,
	diffusers,
	keras_hub,
	llama_cpp_python,
	multimolecule,
	paddlenlp,
	peft,
	sklearn,
	transformers,
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

	describe("peft", () => {
		const base = { id: "user/model", tags: [] as string[], inference: "" };

		it("every PEFT task type has a loader", () => {
			const adapter = (task_type: string) =>
				({ ...base, config: { peft: { base_model_name_or_path: "org/base", task_type } } }) as ModelData;
			expect(peft(adapter("FEATURE_EXTRACTION"))[0]).toContain("AutoModel.from_pretrained");
			expect(peft(adapter("QUESTION_ANS"))[0]).toContain("AutoModelForQuestionAnswering");
			expect(peft(adapter("CAUSAL_LM"))[0]).toContain("AutoModelForCausalLM");
			expect(peft(adapter("UNKNOWN"))[0]).toEqual("Task type is invalid.");
		});

		it("speech seq2seq adapters use the speech auto class", () => {
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

		it("falls back to the model card's base model", () => {
			const snippet = peft({
				...base,
				cardData: { base_model: "org/base" },
				config: { peft: { task_type: "CAUSAL_LM" } },
			} as ModelData)[0];
			expect(snippet).toContain(`"org/base"`);
		});
	});
});
