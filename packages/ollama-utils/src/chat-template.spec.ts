import { describe, expect, it } from "vitest";
import { mapGGUFTemplateToOllama } from "./chat-template";

describe("chat-template", () => {
	it("should format a pre-existing template", async () => {
		// example with chatml template
		const ollamaTmpl = mapGGUFTemplateToOllama({
			chat_template:
				"{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}",
		});
		expect(ollamaTmpl && ollamaTmpl.ollama);
		expect(ollamaTmpl?.ollama.template).toEqual(
			"<|im_start|>system\n{{ .System }}<|im_end|>\n<|im_start|>user\n{{ .Prompt }}<|im_end|>\n<|im_start|>assistant\n"
		);
		expect(ollamaTmpl?.ollama.tokens).toEqual(["<|im_start|>", "<|im_end|>"]);
		expect(ollamaTmpl?.ollama.params?.stop).toEqual(["<|im_start|>", "<|im_end|>"]);
	});

	it("should format by matching tokens", async () => {
		// example with chatml template
		const ollamaTmpl = mapGGUFTemplateToOllama({
			chat_template: "something something <|im_start|> something something <|im_end|>",
		});
		expect(ollamaTmpl && ollamaTmpl.ollama);
		expect(ollamaTmpl?.ollama.template).toEqual(
			"{{ if .System }}<|im_start|>system\n{{ .System }}<|im_end|>\n{{ end }}{{ if .Prompt }}<|im_start|>user\n{{ .Prompt }}<|im_end|>\n{{ end }}<|im_start|>assistant\n{{ .Response }}<|im_end|>\n"
		);
		expect(ollamaTmpl?.ollama.tokens).toEqual(["<|im_start|>", "<|im_end|>"]);
	});

	it("should format using custom map", async () => {
		// example with THUDM/glm-edge-v-2b-gguf
		const ollamaTmpl = mapGGUFTemplateToOllama({
			chat_template: "<|{{ item['role'] }}|>something<|begin_of_image|>",
		});
		expect(ollamaTmpl && ollamaTmpl.ollama);
		expect(ollamaTmpl?.ollama.template).toEqual("{{ if .System }}<|system|>\n{{ .System }}{{ end }}{{ if .Prompt }}<|user|>\n{{ .Prompt }}{{ end }}<|assistant|>\n{{ .Response }}");
	});

	it("should format using @huggingface/jinja", async () => {
		const ollamaTmpl = mapGGUFTemplateToOllama({
			chat_template:
				"{% for message in messages %}{{'<|MY_CUSTOM_TOKEN_START|>' + message['role'] + '\n' + message['content'] + '<|MY_CUSTOM_TOKEN_END|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|MY_CUSTOM_TOKEN_START|>assistant\n' }}{% endif %}",
			bos_token: "<bos>",
			eos_token: "<eos>",
		});
		expect(ollamaTmpl && ollamaTmpl.ollama);
		expect(ollamaTmpl?.ollama.template).toEqual(
			"{{ if .System }}<|MY_CUSTOM_TOKEN_START|>system\n{{ .System }}<|MY_CUSTOM_TOKEN_END|>\n{{ end }}{{ if .Prompt }}<|MY_CUSTOM_TOKEN_START|>user\n{{ .Prompt }}<|MY_CUSTOM_TOKEN_END|>\n{{ end }}<|MY_CUSTOM_TOKEN_START|>assistant\n{{ .Response }}<|MY_CUSTOM_TOKEN_END|>\n"
		);
		expect(ollamaTmpl?.ollama.params?.stop).toEqual([
			"<|MY_CUSTOM_TOKEN_START|>",
			"<|MY_CUSTOM_TOKEN_END|>",
			"<|MY_CUSTOM_TOKEN_START|>user",
		]);
	});

});
