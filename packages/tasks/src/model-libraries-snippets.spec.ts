import { describe, expect, it } from "vitest";
import type { ModelData } from "./model-data.js";
import { llama_cpp_python, transformers } from "./model-libraries-snippets.js";

describe("model-libraries-snippets", () => {
	it("transformers pipeline and auto snippets include device_map auto", async () => {
		const model: ModelData = {
			id: "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
			pipeline_tag: "text-classification",
			tags: [],
			inference: "",
			transformersInfo: {
				auto_model: "AutoModelForSequenceClassification",
				processor: "AutoTokenizer",
				pipeline_tag: "text-classification",
			},
		};
		const snippet = transformers(model);

		expect(snippet[0]).toEqual(`# Use a pipeline as a high-level helper
from transformers import pipeline

pipe = pipeline("text-classification", model="distilbert/distilbert-base-uncased-finetuned-sst-2-english", device_map="auto")`);

		expect(snippet[1]).toEqual(`# Load model directly
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tokenizer = AutoTokenizer.from_pretrained("distilbert/distilbert-base-uncased-finetuned-sst-2-english")
model = AutoModelForSequenceClassification.from_pretrained("distilbert/distilbert-base-uncased-finetuned-sst-2-english", device_map="auto")`);
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
});
