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
		expect(snippet[1].content).toContain("hermes config set model.base_url http://127.0.0.1:8080/v1");
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

	it("gbx-lm - GreenBitAI build turns its draft head on", async () => {
		const { displayOnModelPage, snippet: snippetFunc } = LOCAL_APPS["gbx-lm"];
		const model: ModelData = {
			id: "GreenBitAI/Qwen3.8-Flash-Next-4bit-paged",
			tags: ["mlx", "gbx-lm", "conversational"],
			pipeline_tag: "image-text-to-text",
			config: { model_type: "qwen4_exp" },
			inference: "",
		};
		const snippet = snippetFunc(model);

		expect(displayOnModelPage(model)).toBe(true);
		expect(snippet[0].setup).toContain(
			"curl -fL https://github.com/GreenBitAI/gbx-lm/releases/latest/download/gbx_lm-darwin-arm64.tar.gz | tar -xzf - gbx_lm",
		);
		expect(snippet[0].content).toContain(
			'GBX_QWEN4_MTP=on ~/.local/bin/gbx_lm --model "GreenBitAI/Qwen3.8-Flash-Next-4bit-paged"',
		);
		expect(snippet[0].setup).not.toContain("rm -rf");
		expect(snippet[1].content).toContain("http://localhost:11688/v1/chat/completions");
		expect(snippet[1].content).toContain('"model": "GreenBitAI/Qwen3.8-Flash-Next-4bit-paged"');
	});

	it("gbx-lm - each architecture gets its own draft head switch", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["gbx-lm"];
		const switches: Record<string, string> = {
			deepseek_v41: "GBX_DEEPSEEK_MTP=on",
			glm5_next: "GBX_GLM53_MTP=on",
			qwen4_exp: "GBX_QWEN4_MTP=on",
			qwen3_5: "GBX_QWEN35_MTP=on",
			qwen3_5_moe: "GBX_QWEN35_MTP=on",
		};
		for (const [modelType, expected] of Object.entries(switches)) {
			const model: ModelData = {
				id: "GreenBitAI/some-build",
				tags: ["mlx", "gbx-lm"],
				config: { model_type: modelType },
				inference: "",
			};
			expect(snippetFunc(model)[0].content).toContain(expected);
		}
	});

	it("gbx-lm - tagged build of another architecture runs without a draft head", async () => {
		const { snippet: snippetFunc } = LOCAL_APPS["gbx-lm"];
		const model: ModelData = {
			id: "GreenBitAI/some-build",
			tags: ["mlx", "gbx-lm"],
			config: { model_type: "llama" },
			inference: "",
		};
		const content = snippetFunc(model)[0].content;

		expect(content).not.toContain("=on");
		expect(content).toContain('~/.local/bin/gbx_lm --model "GreenBitAI/some-build"');
	});

	it("gbx-lm - mlx-community text model, without a draft head", async () => {
		const { displayOnModelPage, snippet: snippetFunc } = LOCAL_APPS["gbx-lm"];
		const model: ModelData = {
			id: "mlx-community/Qwen3-0.6B-4bit",
			tags: ["mlx", "conversational"],
			pipeline_tag: "text-generation",
			config: { model_type: "qwen3" },
			inference: "",
		};
		const content = snippetFunc(model)[0].content;

		expect(displayOnModelPage(model)).toBe(true);
		expect(content).not.toContain("=on");
		expect(content).toContain('~/.local/bin/gbx_lm --model "mlx-community/Qwen3-0.6B-4bit"');

		// An architecture that has a switch still gets none outside a gbx-lm build: the head is in its mtp/.
		const moe: ModelData = {
			id: "mlx-community/Qwen3.6-35B-A3B-4bit",
			tags: ["mlx"],
			pipeline_tag: "image-text-to-text",
			config: { model_type: "qwen3_5_moe" },
			inference: "",
		};
		expect(displayOnModelPage(moe)).toBe(true);
		expect(snippetFunc(moe)[0].content).not.toContain("=on");
	});

	it("gbx-lm - mlx-community vision model only for architectures gbx-lm implements", async () => {
		const { displayOnModelPage } = LOCAL_APPS["gbx-lm"];
		const vision = (modelType: string): ModelData => ({
			id: "mlx-community/some-vlm-4bit",
			tags: ["mlx"],
			pipeline_tag: "image-text-to-text",
			config: { model_type: modelType },
			inference: "",
		});

		expect(displayOnModelPage(vision("qwen3_vl"))).toBe(true);
		expect(displayOnModelPage(vision("qwen2_5_vl"))).toBe(false);
	});

	it("gbx-lm not shown for other models", async () => {
		const { displayOnModelPage } = LOCAL_APPS["gbx-lm"];
		const others: ModelData[] = [
			// an MLX checkpoint published outside mlx-community
			{ id: "lmstudio-community/Qwen3-8B-MLX-4bit", tags: ["mlx"], pipeline_tag: "text-generation", inference: "" },
			// mlx-community, but not a text model
			{
				id: "mlx-community/whisper-large-v3-turbo",
				tags: ["mlx"],
				pipeline_tag: "automatic-speech-recognition",
				inference: "",
			},
			// GGUF
			{
				id: "bartowski/Llama-3.2-3B-Instruct-GGUF",
				tags: ["conversational"],
				gguf: { total: 1, context_length: 4096 },
				inference: "",
			},
		];

		for (const model of others) {
			expect(displayOnModelPage(model)).toBe(false);
		}
	});
});
