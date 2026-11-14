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

	it("llama.cpp embedding", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["llama.cpp"];
		const model: ModelData = {
			id: "ggml-org/embeddinggemma-300M-GGUF",
			tags: ["feature-extraction"],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].content).toEqual([
			`# Start a local OpenAI-compatible embeddings server:
llama serve -hf ggml-org/embeddinggemma-300M-GGUF:{{QUANT_TAG}} --embeddings`,
		]);
		expect(snippet.map((s) => s.title)).not.toContain("Use Docker");
	});

	it("llama.cpp decision model is not treated as an embedding model", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["llama.cpp"];
		const model: ModelData = {
			id: "ggml-org/Julia-1-GGUF",
			tags: ["feature-extraction", "decision-model"],
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(snippet[0].content[0]).not.toContain("--embeddings");
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

		expect(snippet[0].content).toContain(`llama serve -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}`);
		expect(snippet[1].setup).toContain("npm install -g @earendil-works/pi-coding-agent");
		expect(snippet[1].content).toContain('"baseUrl": "http://localhost:9931/v1"');
		expect(snippet[1].content).toContain(`"id": "bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}"`);
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
		expect(snippet[1].setup).toContain("npm install -g @earendil-works/pi-coding-agent");
		expect(snippet[1].content).toContain('"baseUrl": "http://localhost:8080/v1"');
		expect(snippet[1].content).toContain('"id": "mlx-community/Llama-3.2-3B-Instruct-mlx"');
		expect(snippet[2].content).toContain("pi");
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

		expect(snippet[0].content).toContain(`llama serve -hf bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}`);
		expect(snippet[1].content).toContain("hermes config set model.provider custom");
		expect(snippet[1].content).toContain("hermes config set model.base_url http://127.0.0.1:9931/v1");
		expect(snippet[1].content).toContain(
			"hermes config set model.default bartowski/Llama-3.2-3B-Instruct-GGUF:{{QUANT_TAG}}",
		);
		expect(snippet[2].content).toContain("hermes");
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
		expect(snippet[1].content).toContain("hermes config set model.base_url http://127.0.0.1:8080/v1");
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
		expect(snippet[1].content).toContain("--custom-base-url http://127.0.0.1:9931/v1");
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
		expect(snippet[1].content).toContain("--custom-base-url http://127.0.0.1:8080/v1");
		expect(snippet[1].content).toContain('--custom-model-id "mlx-community/Llama-3.2-3B-Instruct-mlx"');
		expect(snippet[1].content).toContain("--custom-provider-id mlx-lm");
		expect(snippet[1].content).toContain("--custom-text-input");
		expect(snippet[2].content).toContain('openclaw agent --local --agent main --message "Hello from Hugging Face"');
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

	it("llama deeplink", async () => {
		const { displayOnModelPage, deeplink } = LOCAL_APPS["llama-app"];
		const model: ModelData = {
			id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
			tags: ["conversational"],
			gguf: { total: 1, context_length: 4096 },
			inference: "",
		};

		expect(displayOnModelPage(model)).toBe(true);
		expect(deeplink(model).href).toBe("llama://install?repo=bartowski/Llama-3.2-3B-Instruct-GGUF");
		expect(deeplink(model, "Llama-3.2-3B-Instruct-Q4_K_M.gguf").href).toBe(
			"llama://install?repo=bartowski/Llama-3.2-3B-Instruct-GGUF&quant=Q4_K_M",
		);
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

	it("litert-cli transformers llm", async () => {
		const { displayOnModelPage, snippet: snippetFunc } = LOCAL_APPS["litert-cli"];
		const model: ModelData = {
			id: "Qwen/Qwen3-0.6B",
			pipeline_tag: "text-generation",
			tags: ["transformers", "safetensors", "qwen3", "text-generation", "conversational"],
			config: { architectures: ["Qwen3ForCausalLM"], model_type: "qwen3" },
			safetensors: { parameters: { BF16: 751632384 }, total: 751632384, sharded: false },
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(displayOnModelPage(model)).toBe(true);
		expect(snippet[0].setup).toEqual(`# Install LiteRT CLI from pip:
pip install -U litert-cli-nightly`);
		expect(snippet[0].content).toEqual(`# Run the model (the first run converts it to LiteRT and caches it):
litert lm run Qwen/Qwen3-0.6B --prompt "What is the capital of France?"`);
	});

	it("litert-cli shown for each listed architecture", async () => {
		const { displayOnModelPage } = LOCAL_APPS["litert-cli"];
		// The checkpoints the snippet was run on, one per architecture.
		const models: ModelData[] = [
			{
				id: "Qwen/Qwen3-0.6B",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "qwen3", "text-generation", "conversational"],
				config: { architectures: ["Qwen3ForCausalLM"], model_type: "qwen3" },
				safetensors: { parameters: { BF16: 751632384 }, total: 751632384, sharded: false },
				inference: "",
			},
			{
				id: "HuggingFaceTB/SmolLM2-135M-Instruct",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "llama", "text-generation", "conversational"],
				config: { architectures: ["LlamaForCausalLM"], model_type: "llama" },
				safetensors: { parameters: { BF16: 134515008 }, total: 134515008, sharded: false },
				inference: "",
			},
			{
				id: "Qwen/Qwen2.5-0.5B-Instruct",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "qwen2", "text-generation", "conversational"],
				config: { architectures: ["Qwen2ForCausalLM"], model_type: "qwen2" },
				safetensors: { parameters: { BF16: 494032768 }, total: 494032768, sharded: false },
				inference: "",
			},
			{
				id: "unsloth/gemma-3-270m-it",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "gemma3_text", "text-generation", "conversational"],
				config: { architectures: ["Gemma3ForCausalLM"], model_type: "gemma3_text" },
				safetensors: { parameters: { BF16: 268098176 }, total: 268098176, sharded: false },
				inference: "",
			},
			{
				id: "LiquidAI/LFM2.5-230M-Base",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "lfm2", "text-generation", "conversational"],
				config: { architectures: ["Lfm2ForCausalLM"], model_type: "lfm2" },
				safetensors: { parameters: { BF16: 229693184 }, total: 229693184, sharded: false },
				inference: "",
			},
		];

		for (const model of models) {
			expect(displayOnModelPage(model)).toBe(true);
		}
	});

	it("litert-cli not shown for litert-lm, quantized, gguf-only, mlx, adapter-only, base, large, vision or other-architecture models", async () => {
		const { displayOnModelPage } = LOCAL_APPS["litert-cli"];
		// Each model passes every check but the one it is named for (the vision model's architecture is not listed either).
		const models: ModelData[] = [
			{
				id: "litert-community/Qwen3-0.6B",
				pipeline_tag: "text-generation",
				tags: ["transformers", "litert-lm", "text-generation", "conversational"],
				config: { architectures: ["Qwen3ForCausalLM"], model_type: "qwen3" },
				safetensors: { parameters: { BF16: 751632384 }, total: 751632384, sharded: false },
				inference: "",
			},
			{
				id: "Qwen/Qwen3-4B-AWQ",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "text-generation", "conversational", "awq"],
				config: { architectures: ["Qwen3ForCausalLM"], quantization_config: { bits: 4, quant_method: "awq" } },
				safetensors: { parameters: { I32: 3633315840, BF16: 389152256 }, total: 4022468096, sharded: false },
				inference: "",
			},
			{
				id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
				pipeline_tag: "text-generation",
				tags: ["transformers", "gguf", "conversational"],
				config: { architectures: ["LlamaForCausalLM"], model_type: "llama" },
				gguf: { total: 1, context_length: 4096 },
				inference: "",
			},
			{
				id: "mlx-community/Qwen2.5-Coder-7B-Instruct-4bit",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "mlx", "text-generation", "conversational"],
				config: { architectures: ["Qwen2ForCausalLM"], model_type: "qwen2" },
				safetensors: { parameters: { U32: 1 }, total: 1, sharded: false },
				inference: "",
			},
			{
				id: "someone/Qwen3-0.6B-LoRA",
				pipeline_tag: "text-generation",
				tags: ["transformers", "peft", "safetensors", "text-generation", "conversational"],
				safetensors: { parameters: { F32: 1 }, total: 1, sharded: false },
				inference: "",
			},
			{
				id: "HuggingFaceTB/SmolLM2-135M",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "llama", "text-generation"],
				config: { architectures: ["LlamaForCausalLM"], model_type: "llama" },
				safetensors: { parameters: { BF16: 134515008 }, total: 134515008, sharded: false },
				inference: "",
			},
			{
				// `total` is far below the per-dtype sum on this repo.
				id: "laion/delphi-1e22-9_7Bparams-160Btokens-base-wc386k_lr1e5-sft",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "qwen3", "text-generation", "conversational"],
				config: { architectures: ["Qwen3ForCausalLM"], model_type: "qwen3" },
				safetensors: { parameters: { BF16: 9714698752 }, total: 297472, sharded: true },
				inference: "",
			},
			{
				id: "microsoft/Phi-3.5-mini-instruct",
				pipeline_tag: "text-generation",
				tags: ["transformers", "safetensors", "phi3", "text-generation", "conversational"],
				config: { architectures: ["Phi3ForCausalLM"], model_type: "phi3" },
				safetensors: { parameters: { BF16: 3821079552 }, total: 3821079552, sharded: true },
				inference: "",
			},
			{
				id: "HuggingFaceTB/SmolVLM-256M-Instruct",
				pipeline_tag: "image-text-to-text",
				tags: ["transformers", "safetensors", "conversational"],
				config: { architectures: ["Idefics3ForConditionalGeneration"], model_type: "idefics3" },
				safetensors: { parameters: { BF16: 256484928 }, total: 256484928, sharded: false },
				inference: "",
			},
		];

		for (const model of models) {
			expect(displayOnModelPage(model)).toBe(false);
		}
	});
});
