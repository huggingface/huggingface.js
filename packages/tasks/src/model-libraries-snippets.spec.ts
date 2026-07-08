import { describe, expect, it } from "vitest";
import type { ModelData } from "./model-data.js";
import { litert_lm, llama_cpp_python } from "./model-libraries-snippets.js";

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

	it("litert_lm", async () => {
		const model: ModelData = {
			id: "litert-community/gemma-4-E2B-it-litert-lm",
			tags: [""],
			inference: "",
		};
		const snippet = litert_lm(model);

		expect(snippet.join("\n"))
			.toEqual(`# LiteRT-LM runs on various platforms (Android, iOS, Windows, Linux, macOS, IoT, Web/WASM)
# and supports many APIs (C++, Python, Kotlin, Swift, JavaScript, Flutter).
# For platform-specific integration guides, please refer to the official developer website:
# https://ai.google.dev/edge/litert-lm

# To try LiteRT-LM, the easiest way is to use our CLI tool.
# 1. Install the LiteRT-LM CLI tool (at least 0.14.0):
pip install "litert-lm>=0.14.0"

# 2. Download and run this model locally:
# See: https://ai.google.dev/edge/litert-lm/cli
litert-lm run \\
  --from-huggingface-repo=litert-community/gemma-4-E2B-it-litert-lm \\
  --prompt="Write me a poem"`);
	});
});
