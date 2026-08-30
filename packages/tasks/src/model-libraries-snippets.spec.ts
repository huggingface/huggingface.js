import { describe, expect, it } from "vitest";
import type { ModelData } from "./model-data.js";
import {
	adapters,
	aneforge,
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
	it("aneforge dispatches per pipeline: text-generation, zero-shot (CLIP), and the sentence-transformers default", async () => {
		const llm = aneforge({ id: "aneforge/gpt2", pipeline_tag: "text-generation", tags: [], inference: "" });
		expect(llm.join("\n")).toContain(`af.load_llm("aneforge/gpt2")`);

		const clip = aneforge({
			id: "aneforge/clip-vit-base-patch32",
			pipeline_tag: "zero-shot-image-classification",
			tags: ["clip"],
			inference: "",
		});
		expect(clip.join("\n")).toContain(`af.load_clip("aneforge/clip-vit-base-patch32")`);

		const emb = aneforge({
			id: "aneforge/all-MiniLM-L6-v2",
			pipeline_tag: "sentence-similarity",
			tags: [],
			inference: "",
		});
		expect(emb.join("\n")).toContain(`SentenceTransformer("aneforge/all-MiniLM-L6-v2")`);
	});

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
});
