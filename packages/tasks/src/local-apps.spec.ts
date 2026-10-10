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
llama serve -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}`,
			`# Run inference directly in the terminal:
llama cli -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}`,
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
llama serve -hf mlabonne/gemma-2b-GGUF:{{QUANT_TAG}}`,
			`# Run inference directly in the terminal:
llama cli -hf mlabonne/gemma-2b-GGUF:{{QUANT_TAG}}`,
		]);
	});

	it("llama.cpp winget and source build", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["llama.cpp"];
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = snippetFunc(model, "Llama-3.2-3B-Instruct-Q4_K_M.gguf");

		// the WinGet package only puts llama-server and llama-cli on PATH, not the unified llama binary
		expect(snippet[1].setup).toBe("winget install llama.cpp");
		expect(snippet[1].content).toEqual([
			`# Start a local OpenAI-compatible server with a web UI:
llama-server -hf bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M`,
			`# Run inference directly in the terminal:
llama-cli -hf bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M`,
		]);
		// without OpenSSL headers, cmake disables HTTPS and -hf cannot download
		expect(snippet[3].setup).toContain("libssl-dev");
		expect(snippet[3].setup).toContain("git clone https://github.com/ggml-org/llama.cpp.git");
	});

	it("localai docker", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS.localai;
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096 },
			inference: "",
		};
		const snippet = snippetFunc(model, "Llama-3.2-3B-Instruct-Q4_K_M.gguf");

		expect(snippet[0].content).toBe(`# Load and run the model:
local-ai run huggingface://bartowski/Llama-3.2-3B-Instruct-GGUF/Llama-3.2-3B-Instruct-Q4_K_M.gguf`);
		expect(snippet[1].setup).toContain("docker pull localai/localai:latest");
		expect(snippet[1].content).toBe(`# Load and run the model:
docker run -p 8080:8080 --name localai -v $PWD/models:/models localai/localai:latest huggingface://bartowski/Llama-3.2-3B-Instruct-GGUF/Llama-3.2-3B-Instruct-Q4_K_M.gguf`);
	});

	it("mlx-lm server", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["mlx-lm"];
		const model: ModelData = {
			id: "mlx-community/Qwen3-0.6B-4bit",
			tags: ["mlx", "conversational"],
			pipeline_tag: "text-generation",
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[1].content).toContain('mlx_lm.server --model "mlx-community/Qwen3-0.6B-4bit"');
		// mlx_lm.server listens on 8080 by default
		expect(snippet[1].content).toContain('curl -X POST "http://localhost:8080/v1/chat/completions"');
	});

	it("tgi conversational and non-conversational", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS.tgi;
		const chat = snippetFunc({
			id: "HuggingFaceTB/SmolLM2-135M-Instruct",
			tags: ["text-generation-inference", "conversational"],
			inference: "",
		});
		expect(chat[0].content[0]).toContain('curl -X POST "http://localhost:8000/v1/chat/completions"');

		// without a chat template, TGI answers /v1/chat/completions with "template not found"
		const base = snippetFunc({
			id: "openai-community/gpt2",
			tags: ["text-generation-inference"],
			inference: "",
		});
		expect(base[0].content[0]).toContain('curl -X POST "http://localhost:8000/v1/completions"');
		expect(base[0].content[0]).toContain('"prompt": "Once upon a time,"');
		expect(base[0].setup).toContain('\t-e HF_TOKEN="<secret>" \\');
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

		expect(snippet[0].content).toContain(
			`llama serve -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}} --port 8080`,
		);
		expect(snippet[1].setup).toContain("npm install -g @earendil-works/pi-coding-agent");
		expect(snippet[1].content).toContain(`"id": "bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}"`);
		// without --provider, Pi picks any other provider it has credentials for (e.g. Hugging Face via HF_TOKEN)
		expect(snippet[2].content).toBe(`# Start Pi in your project directory:
pi --provider llama-cpp --model "bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}"`);
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
		expect(snippet[1].setup).toContain("npm install -g @earendil-works/pi-coding-agent");
		expect(snippet[1].content).toContain('"baseUrl": "http://localhost:8080/v1"');
		expect(snippet[1].content).toContain('"id": "mlx-community/Llama-3.2-3B-Instruct-mlx"');
		expect(snippet[2].content).toContain('pi --provider mlx-lm --model "mlx-community/Llama-3.2-3B-Instruct-mlx"');
	});

	it("hermes-agent", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["hermes-agent"];
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096, chat_template: "{% if tools %}" },
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].content).toContain(
			`llama serve -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}} --port 8080`,
		);
		// the installer already runs the setup wizard when it has a terminal, and the server is configured below
		expect(snippet[1].setup).toContain("install.sh | bash -s -- --non-interactive");
		expect(snippet[1].setup).not.toContain("hermes setup");
		expect(snippet[1].content).toContain("hermes config set model.provider custom");
		expect(snippet[1].content).toContain("hermes config set model.base_url http://127.0.0.1:8080/v1");
		expect(snippet[1].content).toContain(
			"hermes config set model.default bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}",
		);
		expect(snippet[2].content).toContain("hermes");
	});

	it("hermes-agent needs a 64K context window", async () => {
		const { displayOnModelPage } = LOCAL_APPS["hermes-agent"];
		const model = (context_length: number): ModelData => ({
			id: "unsloth/Qwen3-4B-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length, chat_template: "{% if tools %}" },
			inference: "",
		});

		expect(displayOnModelPage(model(40960))).toBe(false);
		expect(displayOnModelPage(model(262144))).toBe(true);
		expect(LOCAL_APPS.pi.displayOnModelPage(model(40960))).toBe(true);
	});

	it("hermes-agent - mlx", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["hermes-agent"];
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
		expect(snippet[1].content).toContain("hermes config set model.provider custom");
		expect(snippet[1].content).toContain("hermes config set model.default mlx-community/Llama-3.2-3B-Instruct-mlx");
		expect(snippet[2].content).toContain("hermes");
	});

	it("openclaw", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS.openclaw;
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096, chat_template: "{% if tools %}" },
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].content).toContain(`llama serve -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}`);
		expect(snippet[1].setup).toContain("npm install -g openclaw@latest");
		expect(snippet[1].content).toContain("openclaw onboard --non-interactive --mode local");
		expect(snippet[1].content).toContain("--auth-choice custom-api-key");
		expect(snippet[1].content).toContain("--custom-base-url http://127.0.0.1:8080/v1");
		expect(snippet[1].content).toContain('--custom-model-id "bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}"');
		expect(snippet[1].content).toContain("--custom-provider-id llama-cpp");
		expect(snippet[1].content).toContain("--custom-compatibility openai");
		expect(snippet[1].content).not.toContain("--custom-api-key");
		expect(snippet[1].content).toContain("--custom-text-input");
		expect(snippet[1].content).toContain("--accept-risk");
		expect(snippet[1].content).toContain("--skip-health");
		expect(snippet[2].content).toContain('openclaw agent --local --agent main --message "Hello from Hugging Face"');
	});

	it("openclaw - mlx", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS.openclaw;
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
		expect(snippet[1].content).toContain("openclaw onboard --non-interactive --mode local");
		expect(snippet[1].content).toContain('--custom-model-id "mlx-community/Llama-3.2-3B-Instruct-mlx"');
		expect(snippet[1].content).toContain("--custom-provider-id mlx-lm");
		expect(snippet[1].content).toContain("--custom-text-input");
		expect(snippet[2].content).toContain('openclaw agent --local --agent main --message "Hello from Hugging Face"');
	});

	it("serving engines skip MLX and GGUF-only repos", async () => {
		const shown = (model: ModelData) =>
			(["vllm", "sglang", "tgi", "docker-model-runner"] as const).filter((app) =>
				LOCAL_APPS[app].displayOnModelPage(model),
			);

		// vLLM and SGLang fail with "Cannot find any model weights" on a repo that only ships GGUF files
		expect(
			shown({
				id: "unsloth/Qwen3-0.6B-GGUF",
				tags: ["transformers", "gguf", "text-generation", "conversational"],
				pipeline_tag: "text-generation",
				gguf: { total: 1, context_length: 40960 },
				inference: "",
			}),
		).toEqual(["docker-model-runner"]);
		// none of the engines can load MLX quantized weights
		expect(
			shown({
				id: "mlx-community/Qwen2.5-Coder-7B-Instruct-4bit",
				tags: ["transformers", "safetensors", "mlx", "text-generation", "conversational", "text-generation-inference"],
				pipeline_tag: "text-generation",
				safetensors: { parameters: { U32: 1 }, total: 1, sharded: false },
				inference: "",
			}),
		).toEqual(["docker-model-runner"]);
		expect(
			shown({
				id: "Qwen/Qwen3-0.6B",
				tags: ["transformers", "safetensors", "text-generation", "conversational"],
				pipeline_tag: "text-generation",
				safetensors: { parameters: { BF16: 1 }, total: 1, sharded: false },
				inference: "",
			}),
		).toEqual(["vllm", "sglang", "docker-model-runner"]);
	});

	it("vLLM mistral-common model", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["vllm"];
		const model: ModelData = {
			id: "mistralai/Mistral-7B-Instruct-v0.2",
			pipeline_tag: "text-generation",
			tags: ["transformers", "mistral-common", "conversational"],
			inference: "",
		};
		const snippet = snippetFunc(model);

		// forcing the Mistral format fails on repos without params.json, and vLLM detects it when present
		expect(snippet[0].setup).toBe("# Install vLLM from pip:\npip install vllm");
		expect(snippet[0].content[0]).toBe(`# Start the vLLM server:
vllm serve "mistralai/Mistral-7B-Instruct-v0.2"`);
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

	it("atomic chat deeplink - mlx", async () => {
		const { displayOnModelPage, deeplink } = LOCAL_APPS["atomic-chat"];
		const model: ModelData = {
			id: "mlx-community/Llama-3.2-3B-Instruct-4bit",
			tags: ["mlx", "conversational"],
			pipeline_tag: "text-generation",
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(true);
		expect(deeplink(model).href).toBe("atomic-chat://models/huggingface/mlx-community/Llama-3.2-3B-Instruct-4bit");
	});

	it("atomic chat not shown for unrelated model", async () => {
		const { displayOnModelPage } = LOCAL_APPS["atomic-chat"];
		const model: ModelData = {
			id: "meta-llama/Llama-3.2-3B-Instruct",
			tags: ["conversational"],
			pipeline_tag: "text-generation",
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(false);
	});

	it("unsloth tagged model", async () => {
		const { displayOnModelPage, deeplink } = LOCAL_APPS.unsloth;
		const model: ModelData = {
			id: "some-user/my-unsloth-finetune",
			tags: ["unsloth", "conversational"],
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(true);
		expect(deeplink(model, undefined).href).toBe("unsloth://open_from_hf?model=some-user%2Fmy-unsloth-finetune");
	});

	it("unsloth namespace gguf model", async () => {
		const { displayOnModelPage, deeplink } = LOCAL_APPS.unsloth;
		const model: ModelData = {
			id: "unsloth/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096 },
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(true);
		expect(deeplink(model, undefined).href).toBe("unsloth://open_from_hf?model=unsloth%2FLlama-3.2-3B-Instruct-GGUF");
		expect(deeplink(model, "Llama-3.2-3B-Instruct-UD-Q4_K_XL.gguf").href).toBe(
			"unsloth://open_from_hf?model=unsloth%2FLlama-3.2-3B-Instruct-GGUF&file=Llama-3.2-3B-Instruct-UD-Q4_K_XL.gguf",
		);
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
