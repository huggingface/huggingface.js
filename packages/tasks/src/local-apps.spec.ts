import { describe, expect, it } from "vitest";
import { LOCAL_APPS } from "./local-apps.js";
import type { ModelData } from "./model-data.js";

describe("local-apps", () => {
	it("llama.cpp conversational", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["llama.cpp"];
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].content).toEqual([
			`# Start a local OpenAI-compatible server with a web UI:
llama-server -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}`,
			`# Run inference directly in the terminal:
llama-cli -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}`,
		]);
	});

	it("llama.cpp non-conversational", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["llama.cpp"];
		const model: ModelData = {
			id: "mlabonne/gemma-2b-GGUF",
			tags: [],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].content).toEqual([
			`# Start a local OpenAI-compatible server with a web UI:
llama-server -hf mlabonne/gemma-2b-GGUF:{{QUANT_TAG}}`,
			`# Run inference directly in the terminal:
llama-cli -hf mlabonne/gemma-2b-GGUF:{{QUANT_TAG}}`,
		]);
	});

	it("vLLM conversational llm", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["vllm"];
		const model: ModelData = {
			id: "meta-llama/Llama-3.2-3B-Instruct",
			pipeline_tag: "text-generation",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect((snippet[0].content as string[]).join("\n")).toEqual(`# Start the vLLM server:
vllm serve "meta-llama/Llama-3.2-3B-Instruct"
# Call the server using curl (OpenAI-compatible API):
curl -X POST "http://localhost:8000/v1/chat/completions" \\
	-H "Content-Type: application/json" \\
	--data '{
		"model": "meta-llama/Llama-3.2-3B-Instruct",
		"messages": [
			{
				"role": "user",
				"content": "What is the capital of France?"
			}
		]
	}'`);
	});

	it("vLLM non-conversational llm", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["vllm"];
		const model: ModelData = {
			id: "meta-llama/Llama-3.2-3B",
			tags: [""],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect((snippet[0].content as string[]).join("\n")).toEqual(`# Start the vLLM server:
vllm serve "meta-llama/Llama-3.2-3B"
# Call the server using curl (OpenAI-compatible API):
curl -X POST "http://localhost:8000/v1/completions" \\
	-H "Content-Type: application/json" \\
	--data '{
		"model": "meta-llama/Llama-3.2-3B",
		"prompt": "Once upon a time,",
		"max_tokens": 512,
		"temperature": 0.5
	}'`);
	});

	it("vLLM conversational vlm", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["vllm"];
		const model: ModelData = {
			id: "meta-llama/Llama-3.2-11B-Vision-Instruct",
			pipeline_tag: "image-text-to-text",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect((snippet[0].content as string[]).join("\n")).toEqual(`# Start the vLLM server:
vllm serve "meta-llama/Llama-3.2-11B-Vision-Instruct"
# Call the server using curl (OpenAI-compatible API):
curl -X POST "http://localhost:8000/v1/chat/completions" \\
	-H "Content-Type: application/json" \\
	--data '{
		"model": "meta-llama/Llama-3.2-11B-Vision-Instruct",
		"messages": [
			{
				"role": "user",
				"content": [
					{
						"type": "text",
						"text": "Describe this image in one sentence."
					},
					{
						"type": "image_url",
						"image_url": {
							"url": "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"
						}
					}
				]
			}
		]
	}'`);
	});

	it("pi", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["pi"];
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096, chat_template: "{% if tools %}" },
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].content).toContain(`llama-server -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}`);
		expect(snippet[1].setup).toContain("npm install -g @mariozechner/pi-coding-agent");
		expect(snippet[1].content).toContain(`"id": "Llama-3.2-3B-Instruct-GGUF"`);
		expect(snippet[2].content).toContain("pi");
	});

	it("pi - mlx", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["pi"];
		const model: ModelData = {
			id: "mlx-community/Llama-3.2-3B-Instruct-mlx",
			tags: ["mlx", "conversational"],
			pipeline_tag: "text-generation",
			config: {
				tokenizer_config: {
					chat_template: "{% if tools %}...{% endif %}",
				},
			},
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].setup).toContain("uv tool install mlx-lm");
		expect(snippet[0].content).toContain('mlx_lm.server --model "mlx-community/Llama-3.2-3B-Instruct-mlx"');
		expect(snippet[1].setup).toContain("npm install -g @mariozechner/pi-coding-agent");
		expect(snippet[1].content).toContain('"baseUrl": "http://localhost:8080/v1"');
		expect(snippet[1].content).toContain('"id": "mlx-community/Llama-3.2-3B-Instruct-mlx"');
		expect(snippet[2].content).toContain("pi");
	});

	it("docker model runner", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["docker-model-runner"];
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096 },
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet).toEqual(`docker model run hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}`);
	});

	it("atomic chat deeplink", async () => {
		const { displayOnModelPage, deeplink } = LOCAL_APPS["atomic-chat"];
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096 },
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(true);
		expect(deeplink(model).href).toBe("atomic-chat://models/huggingface/bartowski/Llama-3.2-3B-Instruct-GGUF");
	});

	it("unsloth tagged model", async () => {
		const { displayOnModelPage, snippet: snippetFunc } = LOCAL_APPS.unsloth;
		const model: ModelData = {
			id: "some-user/my-unsloth-finetune",
			tags: ["unsloth", "conversational"],
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(true);
		const snippet = snippetFunc(model);
		expect(snippet[0].setup).toBe("curl -fsSL https://unsloth.ai/install.sh | sh");
		expect(snippet[0].content).toBe(
			"# Run unsloth studio\nunsloth studio -H 0.0.0.0 -p 8888\n# Then open http://localhost:8888 in your browser\n# Search for some-user/my-unsloth-finetune to start chatting",
		);
		expect(snippet[1].setup).toBe("irm https://unsloth.ai/install.ps1 | iex");
		expect(snippet[1].content).toBe(snippet[0].content);
		expect(snippet[2].setup).toBe("# No setup required");
		expect(snippet[2].content).toBe(
			"# Open https://huggingface.co/spaces/unsloth/studio in your browser\n# Search for some-user/my-unsloth-finetune to start chatting",
		);
		expect(snippet[3].setup).toBe("pip install unsloth");
		expect(snippet[3].content).toBe(
			'from unsloth import FastModel\nmodel, tokenizer = FastModel.from_pretrained(\n    model_name="some-user/my-unsloth-finetune",\n    max_seq_length=2048,\n)',
		);
	});

	it("unsloth namespace gguf model", async () => {
		const { displayOnModelPage, snippet: snippetFunc } = LOCAL_APPS.unsloth;
		const model: ModelData = {
			id: "unsloth/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096 },
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(true);
		const snippet = snippetFunc(model);
		expect(snippet[0].setup).toBe("curl -fsSL https://unsloth.ai/install.sh | sh");
		expect(snippet[0].content).toBe(
			"# Run unsloth studio\nunsloth studio -H 0.0.0.0 -p 8888\n# Then open http://localhost:8888 in your browser\n# Search for unsloth/Llama-3.2-3B-Instruct-GGUF to start chatting",
		);
		expect(snippet[1].setup).toBe("irm https://unsloth.ai/install.ps1 | iex");
		expect(snippet[1].content).toBe(snippet[0].content);
		expect(snippet[2].setup).toBe("# No setup required");
		expect(snippet[2].content).toBe(
			"# Open https://huggingface.co/spaces/unsloth/studio in your browser\n# Search for unsloth/Llama-3.2-3B-Instruct-GGUF to start chatting",
		);
		expect(snippet).toHaveLength(3); // GGUF models only get 3 snippets
	});

	it("non unsloth namespace gguf model", async () => {
		const { displayOnModelPage } = LOCAL_APPS.unsloth;
		const model: ModelData = {
			id: "dummy/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096 },
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(true);
	});

	it("unsloth not shown for unrelated model", async () => {
		const { displayOnModelPage } = LOCAL_APPS.unsloth;
		const model: ModelData = {
			id: "meta-llama/Llama-3.2-3B-Instruct",
			tags: ["conversational"],
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(false);
	});

	it("links as a function", async () => {
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			inference: "",
		};
		const appWithFnLinks = {
			...LOCAL_APPS["llama.cpp"],
			links: (m: ModelData) => [{ label: "Releases", url: `https://github.com/${m.id}/releases` }],
		};

		expect(appWithFnLinks.links(model)).toEqual([
			{ label: "Releases", url: "https://github.com/bartowski/Llama-3.2-3B-Instruct-GGUF/releases" },
		]);
	});
});
