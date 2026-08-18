import { describe, expect, it } from "vitest";
import type { ModelData } from "./model-data.js";
import { llama_cpp_python, peft } from "./model-libraries-snippets.js";

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

	it("peft text seq2seq adapter", async () => {
		const model: ModelData = {
			id: "smangrul/twitter_complaints_bigscience_T0_3B_LORA_SEQ_2_SEQ_LM",
			tags: ["peft"],
			inference: "",
			config: {
				peft: { base_model_name_or_path: "bigscience/T0_3B", task_type: "SEQ_2_SEQ_LM" },
			},
		};
		const snippet = peft(model);

		expect(snippet.join("\n")).toEqual(`from peft import PeftModel
from transformers import AutoModelForSeq2SeqLM

base_model = AutoModelForSeq2SeqLM.from_pretrained("bigscience/T0_3B")
model = PeftModel.from_pretrained(base_model, "smangrul/twitter_complaints_bigscience_T0_3B_LORA_SEQ_2_SEQ_LM")`);
	});

	it("peft speech seq2seq adapter (whisper)", async () => {
		const model: ModelData = {
			id: "nazarkozak/whisper-small-disfluent-verbatim-lora",
			pipeline_tag: "automatic-speech-recognition",
			tags: ["peft"],
			inference: "",
			config: {
				peft: { base_model_name_or_path: "openai/whisper-small", task_type: "SEQ_2_SEQ_LM" },
			},
		};
		const snippet = peft(model);

		expect(snippet.join("\n")).toEqual(`from peft import PeftModel
from transformers import AutoModelForSpeechSeq2Seq

base_model = AutoModelForSpeechSeq2Seq.from_pretrained("openai/whisper-small")
model = PeftModel.from_pretrained(base_model, "nazarkozak/whisper-small-disfluent-verbatim-lora")`);
	});
});
