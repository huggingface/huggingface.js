import { describe, expect, it } from "vitest";
import { convertGGUFTemplateToOllama } from "./chat-template";

interface UnknownCase {
	desc: string;
	jinjaTmpl: string;
	ollamaTmpl: string;
	stop?: string;
}

describe("chat-template", () => {
	it("should format a pre-existing template", async () => {
		// example with chatml template
		const ollamaTmpl = convertGGUFTemplateToOllama({
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
		const ollamaTmpl = convertGGUFTemplateToOllama({
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
		const ollamaTmpl = convertGGUFTemplateToOllama({
			chat_template: "<|{{ item['role'] }}|>something<|begin_of_image|>",
		});
		expect(ollamaTmpl && ollamaTmpl.ollama);
		expect(ollamaTmpl?.ollama.template).toEqual(
			"{{ if .System }}<|system|>\n{{ .System }}{{ end }}{{ if .Prompt }}<|user|>\n{{ .Prompt }}{{ end }}<|assistant|>\n{{ .Response }}"
		);
	});

	it("should format using @huggingface/jinja", async () => {
		const ollamaTmpl = convertGGUFTemplateToOllama({
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

	it.each([
		{
			desc: "This template has system message baked inside it",
			jinjaTmpl:
				"{{ '以下是描述一项任务的指令。请输出合适的内容回应指令。\n### Input:\n大象和猎豹的奔跑速度谁更快，简单说明原因.\n\n### Response:\n猎豹的奔跑速度比大象快得多。\n\n猎豹：是世界上奔跑速度最快的陆地动物之一，短距离内可以达到约 100-120 公里/小时（约 60-75 英里/小时）。\n大象：虽然大象体型巨大，但它们的速度较慢，奔跑速度最高约为 40 公里/小时（约 25 英里/小时）。\n因此，猎豹在速度上远远超过了大象。\n\n### Input:\n鱼为什么能在水里呼吸。\n\n### Response:\n鱼能够在水中呼吸，主要是因为它们有一种特殊的呼吸器官——鳃。鳃能够从水中提取氧气，并排出二氧化碳，这个过程使鱼能够在水中生存。\n' }}{% for message in messages %}{% if message['role'] == 'user' %}{{ '\n\n### 指令：\n' + message['content'] + '\n\n' }}{% elif message['role'] == 'assistant' %}{{ '### 回应：\n' + message['content'] + '<|end_of_text|>' }}{% else %}{{ raise_exception('Only user and assistant roles are supported!') }}{% endif %}{% endfor %}{% if add_generation_prompt %}{{ '### 回应：\n' }}{% endif %}",
			ollamaTmpl:
				'以下是描述一项任务的指令。请输出合适的内容回应指令。\n### Input:\n大象和猎豹的奔跑速度谁更快，简单说明原因.\n\n### Response:\n猎豹的奔跑速度比大象快得多。\n\n猎豹：是世界上奔跑速度最快的陆地动物之一，短距离内可以达到约 100-120 公里/小时（约 60-75 英里/小时）。\n大象：虽然大象体型巨大，但它们的速度较慢，奔跑速度最高约为 40 公里/小时（约 25 英里/小时）。\n因此，猎豹在速度上远远超过了大象。\n\n### Input:\n鱼为什么能在水里呼吸。\n\n### Response:\n鱼能够在水中呼吸，主要是因为它们有一种特殊的呼吸器官——鳃。鳃能够从水中提取氧气，并排出二氧化碳，这个过程使鱼能够在水中生存。\n{{- range .Messages }}{{- if eq .Role "user" }}\n\n### 指令：\n{{ .Content }}\n\n{{- else if eq .Role "assistant" }}### 回应：\n{{ .Content }}<|end_of_text|>{{- end }}{{- end }}### 回应：\n',
			stop: "###",
		},
		{
			desc: "Another template with system message baked inside it",
			jinjaTmpl:
				"{{ bos_token }}{%- if messages[0]['role'] == 'system' -%}{% set loop_messages = messages[1:] %}{%- else -%}{% set loop_messages = messages %}{% endif %}System: This is a chat between a user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions based on the context. The assistant should also indicate when the answer cannot be found in the context.\n\n{% for message in loop_messages %}{%- if message['role'] == 'user' -%}User: {{ message['content'].strip() + '\n\n' }}{%- else -%}Assistant: {{ message['content'].strip() + '\n\n' }}{%- endif %}{% if loop.last and message['role'] == 'user' %}Assistant:{% endif %}{% endfor %}",
			ollamaTmpl:
				'<bos>System: This is a chat between a user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user\'s questions based on the context. The assistant should also indicate when the answer cannot be found in the context.\n\n{{- range .Messages }}{{- if eq .Role "user" }}User: {{ .Content }}\n\nAssistant:{{- else if eq .Role "assistant" }} {{ .Content }}\n\n{{- end }}{{- end }} ',
			stop: "User:",
		},
		{
			desc: "Template formatted via jinja - 1",
			jinjaTmpl:
				"{% for message in messages %}{% if message['role'] == 'user' %}{{ '<|prompt|>' + message['content'] + eos_token }}{% elif message['role'] == 'system' %}{{ '<|system|>' + message['content'] + eos_token }}{% elif message['role'] == 'assistant' %}{{ '<|answer|>' + message['content'] + eos_token }}{% endif %}{% if loop.last and add_generation_prompt %}{{ '<|answer|>' }}{% endif %}{% endfor %}",
			ollamaTmpl:
				"{{ if .System }}<|system|>{{ .System }}<eos>{{ end }}{{ if .Prompt }}<|prompt|>{{ .Prompt }}<eos>{{ end }}<|answer|>{{ .Response }}<eos>",
			stop: "<eos>",
		},
		{
			desc: "Template formatted via jinja - 2",
			jinjaTmpl:
				"{{ '<s>' }}{% if messages[0]['role'] == 'system' %}{% set system_message = messages[0]['content'] %}{% endif %}{% if system_message is defined %}{{ '<|system|>\n' + system_message + '<|end|>\n' }}{% endif %}{% for message in messages %}{% set content = message['content'] %}{% if message['role'] == 'user' %}{{ '<|user|>\n' + content + '<|end|>\n<|assistant|>\n' }}{% elif message['role'] == 'assistant' %}{{ content + '<|end|>' + '\n' }}{% endif %}{% endfor %}",
			ollamaTmpl:
				"{{ if .System }}<|system|>\n{{ .System }}<|end|>\n{{ end }}{{ if .Prompt }}<|user|>\n{{ .Prompt }}<|end|>\n{{ end }}<|assistant|>\n{{ .Response }}<|end|>",
			stop: "<|end|>",
		},
		{
			desc: "Template formatted via jinja - 3",
			jinjaTmpl:
				"{% for message in messages %}{% if loop.first %}[gMASK]<sop><|{{ message['role'] }}|>\n {{ message['content'] }}{% else %}<|{{ message['role'] }}|>\n {{ message['content'] }}{% endif %}{% endfor %}{% if add_generation_prompt %}<|assistant|>{% endif %}",
			ollamaTmpl:
				"{{ if .System }}[gMASK]<sop><|system|>\n {{ .System }}{{ end }}{{ if .Prompt }}<|user|>\n {{ .Prompt }}{{ end }}<|assistant|>\n {{ .Response }}",
			stop: "<|assistant|>",
		},
		{
			desc: "Template formatted via jinja - 4",
			jinjaTmpl:
				"{% if messages[0]['role'] == 'system' %}{% set loop_messages = messages[1:] %}{{ messages[0]['content'].strip() }}{% else %}{% set loop_messages = messages %}{{ 'A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user\\'s questions.' }}{% endif %}{% for message in loop_messages %}{% if loop.index0 == 0 %}{% if message['role'] == 'system' or message['role'] == 'user' %}{{ ' USER: ' + message['content'].strip() }}{% else %}{{ ' ASSISTANT: ' + message['content'].strip() + eos_token }}{% endif %}{% else %}{% if message['role'] == 'system' or message['role'] == 'user' %}{{ '\nUSER: ' + message['content'].strip() }}{% else %}{{ ' ASSISTANT: ' + message['content'].strip() + eos_token }}{% endif %}{% endif %}{% endfor %}{% if add_generation_prompt %}{{ ' ASSISTANT:' }}{% endif %}",
			ollamaTmpl:
				"{{ if .System }}{{ .System }}{{ end }}{{ if .Prompt }}\nUSER: {{ .Prompt }}{{ end }} ASSISTANT: {{ .Response }}<eos>",
			stop: "USER:",
		},
		{
			desc: "granite-3.0-8b-instruct-GGUF - officially supported by ollama",
			jinjaTmpl:
				"{%- if tools %}\n    {{- '<|start_of_role|>available_tools<|end_of_role|>\n' }}\n    {%- for tool in tools %}\n    {{- tool | tojson(indent=4) }}\n    {%- if not loop.last %}\n        {{- '\n\n' }}\n    {%- endif %}\n    {%- endfor %}\n    {{- '<|end_of_text|>\n' }}\n{%- endif %}\n{%- for message in messages %}\n    {%- if message['role'] == 'system' %}\n    {{- '<|start_of_role|>system<|end_of_role|>' + message['content'] + '<|end_of_text|>\n' }}\n    {%- elif message['role'] == 'user' %}\n    {{- '<|start_of_role|>user<|end_of_role|>' + message['content'] + '<|end_of_text|>\n' }}\n    {%- elif message['role'] == 'assistant' %}\n    {{- '<|start_of_role|>assistant<|end_of_role|>'  + message['content'] + '<|end_of_text|>\n' }}\n    {%- elif message['role'] == 'assistant_tool_call' %}\n    {{- '<|start_of_role|>assistant<|end_of_role|><|tool_call|>' + message['content'] + '<|end_of_text|>\n' }}\n    {%- elif message['role'] == 'tool_response' %}\n    {{- '<|start_of_role|>tool_response<|end_of_role|>' + message['content'] + '<|end_of_text|>\n' }}\n    {%- endif %}\n    {%- if loop.last and add_generation_prompt %}\n    {{- '<|start_of_role|>assistant<|end_of_role|>' }}\n    {%- endif %}\n{%- endfor %}",
			ollamaTmpl:
				'{{- if .Tools }}<|start_of_role|>available_tools<|end_of_role|>\n{{- range .Tools }}\n{{ . }}\n{{ end }}<|end_of_text|>\n{{ end }}\n{{- range $index, $_ := .Messages }}<|start_of_role|>\n{{- if eq .Role "tool" }}tool_response\n{{- else }}{{ .Role }}\n{{- end }}<|end_of_role|>\n{{- if .Content }}{{ .Content }}\n{{- else if .ToolCalls }}<|tool_call|>\n{{- range .ToolCalls }}{"name": "{{ .Function.Name }}", "arguments": {{ .Function.Arguments }}}\n{{- end }}\n{{- end }}\n{{- if eq (len (slice $.Messages $index)) 1 }}\n{{- if eq .Role "assistant" }}\n{{- else }}<|end_of_text|>\n<|start_of_role|>assistant<|end_of_role|>\n{{- end }}\n{{- else }}<|end_of_text|>\n{{ end }}\n{{- end }}',
			// stop token is EOS, auto detected by ollama
		},
		{
			desc: "chatglm4",
			jinjaTmpl:
				"{% for message in messages %}{% if loop.first %}[gMASK]sop<|{{ message['role'] }}|>\n {{ message['content'] }}{% else %}<|{{ message['role'] }}|>\n {{ message['content'] }}{% endif %}{% endfor %}{% if add_generation_prompt %}<|assistant|>{% endif %}",
			ollamaTmpl:
				"{{ if .System }}[gMASK]sop<|system|>\n {{ .System }}{{ end }}{{ if .Prompt }}<|user|>\n {{ .Prompt }}{{ end }}<|assistant|>\n {{ .Response }}",
			stop: "<|assistant|>",
		},
		{
			// this case is currently without CUSTOM_TEMPLATE_MAPPING, because the jinja template does not produce "incremental" format (i.e. it adds eos_token to the end)
			desc: "non-incremental format",
			jinjaTmpl:
				"{{ bos_token }}{% for message in messages %}{{'<|' + message['role'] + '|>' + '\n' + message['content'] + '<|end|>\n' }}{% endfor %}{% if add_generation_prompt %}{{ '<|assistant|>\n' }}{% else %}{{ eos_token }}{% endif %}",
			ollamaTmpl:
				"{{ if .System }}<|system|>\n{{ .System }}<|end|>\n{{ end }}{{ if .Prompt }}<|user|>\n{{ .Prompt }}<|end|>\n{{ end }}<|assistant|>\n{{ .Response }}<|end|>",
			stop: "<|end|>",
		},
	] satisfies UnknownCase[])("should format known cases ($desc)", async (currCase: UnknownCase) => {
		// some known cases that we observed on the hub
		const ollamaTmpl = convertGGUFTemplateToOllama({
			chat_template: currCase.jinjaTmpl,
			bos_token: "<bos>",
			eos_token: "<eos>",
		});
		expect(ollamaTmpl && ollamaTmpl.ollama);
		expect(ollamaTmpl?.ollama.template).toEqual(currCase.ollamaTmpl);
		if (currCase.stop) {
			expect(ollamaTmpl?.ollama.params?.stop).toContain(currCase.stop);
		}
	});

	// TODO: add test with "ollama/template" module compiled to wasm
});
