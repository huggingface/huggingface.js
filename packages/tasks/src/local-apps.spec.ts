import { describe, expect, it } from "vitest";
import { LOCAL_APPS } from "./local-apps";
import type { ModelData } from "./model-data";

describe("local-apps", () => {
	it("llama.cpp conversational", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["llama.cpp"];
		const model: ModelData = {
			id: "mlabonne/gemma-2b-it-GGUF",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].content).toEqual(`# Load and run the model:
llama-cli \\
  --hf-repo "mlabonne/gemma-2b-it-GGUF" \\
  --hf-file {{GGUF_FILE}} \\
  -p "You are a helpful assistant" \\
  --conversation`);
	});

	it("llama.cpp non-conversational", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["llama.cpp"];
		const model: ModelData = {
			id: "mlabonne/gemma-2b-GGUF",
			tags: [],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].content).toEqual(`# Load and run the model:
llama-cli \\
  --hf-repo "mlabonne/gemma-2b-GGUF" \\
  --hf-file {{GGUF_FILE}} \\
  -p "Once upon a time"`);
	});

	it("vLLM conversational", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["vllm"];
		const model: ModelData = {
			id: "meta-llama/Llama-3.2-3B-Instruct",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect((snippet[0].content as string[]).join("\n")).toEqual(`# Load and run the model:
vllm serve "meta-llama/Llama-3.2-3B-Instruct"
# Call the server using curl:
curl -X POST "http://localhost:8000/v1/chat/completions" \\
	-H "Content-Type: application/json" \\
	--data '{
		"model": "meta-llama/Llama-3.2-3B-Instruct",
		"messages": [
			{"role": "user", "content": "Hello!"}
		]
	}'`);
	});

	it("vLLM non-conversational", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["vllm"];
		const model: ModelData = {
			id: "meta-llama/Llama-3.2-3B",
			tags: [""],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect((snippet[0].content as string[]).join("\n")).toEqual(`# Load and run the model:
vllm serve "meta-llama/Llama-3.2-3B"
# Call the server using curl:
curl -X POST "http://localhost:8000/v1/completions" \\
	-H "Content-Type: application/json" \\
	--data '{
		"model": "meta-llama/Llama-3.2-3B",
		"prompt": "Once upon a time,",
		"max_tokens": 512,
		"temperature": 0.5
	}'`);
	});
});
