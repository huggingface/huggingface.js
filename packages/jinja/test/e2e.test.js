import { describe, expect, it } from "vitest";

import { Template } from "../src/index";

import { downloadFile } from "@huggingface/hub";

const EXAMPLE_CHAT = [
	{ role: "user", content: "Hello, how are you?" },
	{ role: "assistant", content: "I'm doing great. How can I help you today?" },
	{ role: "user", content: "I'd like to show off how chat templating works!" },
];

const EXAMPLE_CHAT_WITH_SYSTEM = [
	{
		role: "system",
		content: "You are a friendly chatbot who always responds in the style of a pirate",
	},
	...EXAMPLE_CHAT,
];

const EXAMPLE_FUNCTION_CALLING = [
	{
		role: "assistant",
		content: null,
		tool_calls: [
			{
				type: "function",
				function: {
					name: "get_current_weather",
					arguments: '{\n  "location": "Hanoi"\n}',
				},
			},
		],
	},
	{ role: "user", content: "what's the weather like in Hanoi?" },
];

// Example adapted from https://huggingface.co/fireworks-ai/firefunction-v1
const EXAMPLE_FUNCTION_SPEC = [
	{
		name: "get_stock_price",
		description: "Get the current stock price",
		parameters: {
			type: "object",
			properties: {
				symbol: {
					type: "string",
					description: "The stock symbol, e.g. AAPL, GOOG",
				},
			},
			required: ["symbol"],
		},
	},
	{
		name: "check_word_anagram",
		description: "Check if two words are anagrams of each other",
		parameters: {
			type: "object",
			properties: {
				word1: {
					type: "string",
					description: "The first word",
				},
				word2: {
					type: "string",
					description: "The second word",
				},
			},
			required: ["word1", "word2"],
		},
	},
];
const EXAMPLE_FUNCTION_CALLING_WITH_SYSTEM = [
	{ role: "functions", content: JSON.stringify(EXAMPLE_FUNCTION_SPEC, null, 4) },
	{ role: "system", content: "You are a helpful assistant with access to functions. Use them if required." },
	{ role: "user", content: "Hi, can you tell me the current stock price of AAPL?" },
];

const EXAMPLE_TOOL_JSON_SCHEMAS = {
	get_current_weather: {
		type: "function",
		function: {
			name: "get_current_weather",
			description: "Get the current weather in a given location",
			parameters: {
				type: "object",
				properties: {
					location: {
						type: "string",
						description: "The city and state, e.g. San Francisco, CA",
					},
					unit: {
						type: "string",
						enum: ["celsius", "fahrenheit"],
					},
				},
				required: ["location"],
			},
		},
	},
	get_current_temperature_v1: {
		type: "function",
		function: {
			name: "get_current_temperature",
			description: "Get the current temperature at a location.",
			parameters: {
				type: "object",
				properties: {
					location: {
						type: "string",
						description: 'The location to get the temperature for, in the format "City, Country"',
					},
				},
				required: ["location"],
			},
			return: {
				type: "number",
				description: "The current temperature at the specified location in the specified units, as a float.",
			},
		},
	},
	get_current_temperature_v2: {
		type: "function",
		function: {
			name: "get_current_temperature",
			description: "Get the current temperature at a location.",
			parameters: {
				type: "object",
				properties: {
					location: {
						type: "string",
						description: 'The location to get the temperature for, in the format "City, Country"',
					},
					unit: {
						type: "string",
						enum: ["celsius", "fahrenheit"],
						description: "The unit to return the temperature in.",
					},
				},
				required: ["location", "unit"],
			},
			return: {
				type: "number",
				description: "The current temperature at the specified location in the specified units, as a float.",
			},
		},
	},
	get_current_wind_speed: {
		type: "function",
		function: {
			name: "get_current_wind_speed",
			description: "Get the current wind speed in km/h at a given location.",
			parameters: {
				type: "object",
				properties: {
					location: {
						type: "string",
						description: 'The location to get the temperature for, in the format "City, Country"',
					},
				},
				required: ["location"],
			},
			return: {
				type: "number",
				description: "The current wind speed at the given location in km/h, as a float.",
			},
		},
	},
};

const EXAMPLE_LIST_OF_TOOLS = [
	EXAMPLE_TOOL_JSON_SCHEMAS.get_current_temperature_v2,
	EXAMPLE_TOOL_JSON_SCHEMAS.get_current_wind_speed,
];

/**
 * Defined in https://github.com/huggingface/transformers
 * Keys correspond to `model_type` in the transformers repo.
 */
const TEST_DEFAULT_TEMPLATES = Object.freeze({
	_base: {
		chat_template: `{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			add_generation_prompt: false,
		},
		target: `<|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!<|im_end|>\n`,
	},
	blenderbot: {
		// facebook/blenderbot-400M-distill
		chat_template: `{% for message in messages %}{% if message['role'] == 'user' %}{{ ' ' }}{% endif %}{{ message['content'] }}{% if not loop.last %}{{ '  ' }}{% endif %}{% endfor %}{{ eos_token }}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "</s>",
		},
		target: ` Hello, how are you?  I'm doing great. How can I help you today?   I'd like to show off how chat templating works!</s>`,
	},
	blenderbot_small: {
		// facebook/blenderbot_small-90M
		chat_template: `{% for message in messages %}{% if message['role'] == 'user' %}{{ ' ' }}{% endif %}{{ message['content'] }}{% if not loop.last %}{{ '  ' }}{% endif %}{% endfor %}{{ eos_token }}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "</s>",
		},
		target: ` Hello, how are you?  I'm doing great. How can I help you today?   I'd like to show off how chat templating works!</s>`,
	},
	bloom: {
		// bigscience/bloom
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "</s>",
		},
		target: `Hello, how are you?</s>I'm doing great. How can I help you today?</s>I'd like to show off how chat templating works!</s>`,
	},
	gpt_neox: {
		// EleutherAI/gpt-neox-20b
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "<|endoftext|>",
		},
		target: `Hello, how are you?<|endoftext|>I'm doing great. How can I help you today?<|endoftext|>I'd like to show off how chat templating works!<|endoftext|>`,
	},
	gpt2: {
		// gpt2
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "<|endoftext|>",
		},
		target: `Hello, how are you?<|endoftext|>I'm doing great. How can I help you today?<|endoftext|>I'd like to show off how chat templating works!<|endoftext|>`,
	},
	llama: {
		// hf-internal-testing/llama-tokenizer
		chat_template: `{% if messages[0]['role'] == 'system' %}{% set loop_messages = messages[1:] %}{% set system_message = messages[0]['content'] %}{% elif USE_DEFAULT_PROMPT == true and not '<<SYS>>' in messages[0]['content'] %}{% set loop_messages = messages %}{% set system_message = 'DEFAULT_SYSTEM_MESSAGE' %}{% else %}{% set loop_messages = messages %}{% set system_message = false %}{% endif %}{% for message in loop_messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if loop.index0 == 0 and system_message != false %}{% set content = '<<SYS>>\\n' + system_message + '\\n<</SYS>>\\n\\n' + message['content'] %}{% else %}{% set content = message['content'] %}{% endif %}{% if message['role'] == 'user' %}{{ bos_token + '[INST] ' + content.strip() + ' [/INST]' }}{% elif message['role'] == 'system' %}{{ '<<SYS>>\\n' + content.strip() + '\\n<</SYS>>\\n\\n' }}{% elif message['role'] == 'assistant' %}{{ ' ' + content.strip() + ' ' + eos_token }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT_WITH_SYSTEM,
			bos_token: "<s>",
			eos_token: "</s>",
			USE_DEFAULT_PROMPT: true,
		},
		target: `<s>[INST] <<SYS>>\nYou are a friendly chatbot who always responds in the style of a pirate\n<</SYS>>\n\nHello, how are you? [/INST] I'm doing great. How can I help you today? </s><s>[INST] I'd like to show off how chat templating works! [/INST]`,
	},
	whisper: {
		// openai/whisper-large-v3
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "<|endoftext|>",
		},
		target: `Hello, how are you?<|endoftext|>I'm doing great. How can I help you today?<|endoftext|>I'd like to show off how chat templating works!<|endoftext|>`,
	},
});

/**
 * Custom templates that are not defined in the transformers repo.
 * Keys are repo ids on the Hugging Face Hub (https://hf.co/models)
 */
const TEST_CUSTOM_TEMPLATES = Object.freeze({
	"HuggingFaceH4/zephyr-7b-beta (add_generation_prompt=false)": {
		chat_template: `{% for message in messages %}\n{% if message['role'] == 'user' %}\n{{ '<|user|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'system' %}\n{{ '<|system|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'assistant' %}\n{{ '<|assistant|>\n'  + message['content'] + eos_token }}\n{% endif %}\n{% if loop.last and add_generation_prompt %}\n{{ '<|assistant|>' }}\n{% endif %}\n{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT_WITH_SYSTEM,
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<|system|>\nYou are a friendly chatbot who always responds in the style of a pirate</s>\n<|user|>\nHello, how are you?</s>\n<|assistant|>\nI'm doing great. How can I help you today?</s>\n<|user|>\nI'd like to show off how chat templating works!</s>\n`,
	},
	"HuggingFaceH4/zephyr-7b-beta (add_generation_prompt=true)": {
		chat_template: `{% for message in messages %}\n{% if message['role'] == 'user' %}\n{{ '<|user|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'system' %}\n{{ '<|system|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'assistant' %}\n{{ '<|assistant|>\n'  + message['content'] + eos_token }}\n{% endif %}\n{% if loop.last and add_generation_prompt %}\n{{ '<|assistant|>' }}\n{% endif %}\n{% endfor %}`,
		data: {
			messages: [
				{ role: "system", content: "You are a friendly chatbot who always responds in the style of a pirate" },
				{ role: "user", content: "How many helicopters can a human eat in one sitting?" },
			],
			eos_token: "</s>",
			add_generation_prompt: true,
		},
		target: `<|system|>\nYou are a friendly chatbot who always responds in the style of a pirate</s>\n<|user|>\nHow many helicopters can a human eat in one sitting?</s>\n<|assistant|>\n`,
	},
	"HuggingFaceH4/zephyr-7b-gemma-v0.1": {
		chat_template: `{% if messages[0]['role'] == 'user' or messages[0]['role'] == 'system' %}{{ bos_token }}{% endif %}{% for message in messages %}{{ '<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n' }}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% elif messages[-1]['role'] == 'assistant' %}{{ eos_token }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<bos>",
			eos_token: "<eos>",
			add_generation_prompt: false,
		},
		target: `<bos><|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!<|im_end|>\n`,
	},
	"TheBloke/Mistral-7B-Instruct-v0.1-GPTQ": {
		chat_template: `{{ bos_token }}{% for message in messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if message['role'] == 'user' %}{{ '[INST] ' + message['content'] + ' [/INST]' }}{% elif message['role'] == 'assistant' %}{{ message['content'] + eos_token + ' ' }}{% else %}{{ raise_exception('Only user and assistant roles are supported!') }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] I'd like to show off how chat templating works! [/INST]`,
	},
	"mistralai/Mixtral-8x7B-Instruct-v0.1": {
		chat_template: `{{ bos_token }}{% for message in messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if message['role'] == 'user' %}{{ '[INST] ' + message['content'] + ' [/INST]' }}{% elif message['role'] == 'assistant' %}{{ message['content'] + eos_token}}{% else %}{{ raise_exception('Only user and assistant roles are supported!') }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s>[INST] I'd like to show off how chat templating works! [/INST]`,
	},
	"cognitivecomputations/dolphin-2.5-mixtral-8x7b": {
		chat_template: `{% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!<|im_end|>\n`,
	},
	"openchat/openchat-3.5-0106": {
		chat_template: `{{ bos_token }}{% for message in messages %}{{ 'GPT4 Correct ' + message['role'].title() + ': ' + message['content'] + '<|end_of_turn|>'}}{% endfor %}{% if add_generation_prompt %}{{ 'GPT4 Correct Assistant:' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<s>GPT4 Correct User: Hello, how are you?<|end_of_turn|>GPT4 Correct Assistant: I'm doing great. How can I help you today?<|end_of_turn|>GPT4 Correct User: I'd like to show off how chat templating works!<|end_of_turn|>`,
	},
	"upstage/SOLAR-10.7B-Instruct-v1.0": {
		chat_template: `{% for message in messages %}{% if message['role'] == 'system' %}{% if message['content']%}{{'### System:\n' + message['content']+'\n\n'}}{% endif %}{% elif message['role'] == 'user' %}{{'### User:\n' + message['content']+'\n\n'}}{% elif message['role'] == 'assistant' %}{{'### Assistant:\n'  + message['content']}}{% endif %}{% if loop.last and add_generation_prompt %}{{ '### Assistant:\n' }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `### User:\nHello, how are you?\n\n### Assistant:\nI'm doing great. How can I help you today?### User:\nI'd like to show off how chat templating works!\n\n`,
	},
	"codellama/CodeLlama-70b-Instruct-hf": {
		chat_template: `{% if messages[0]['role'] == 'system' %}{% set user_index = 1 %}{% else %}{% set user_index = 0 %}{% endif %}{% for message in messages %}{% if (message['role'] == 'user') != ((loop.index0 + user_index) % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if loop.index0 == 0 %}{{ '<s>' }}{% endif %}{% set content = 'Source: ' + message['role'] + '\n\n ' + message['content'] | trim %}{{ content + ' <step> ' }}{% endfor %}{{'Source: assistant\nDestination: user\n\n '}}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<s>Source: user\n\n Hello, how are you? <step> Source: assistant\n\n I'm doing great. How can I help you today? <step> Source: user\n\n I'd like to show off how chat templating works! <step> Source: assistant\nDestination: user\n\n `,
	},
	"Deci/DeciLM-7B-instruct": {
		chat_template: `{% for message in messages %}\n{% if message['role'] == 'user' %}\n{{ '### User:\n' + message['content'] }}\n{% elif message['role'] == 'system' %}\n{{ '### System:\n' + message['content'] }}\n{% elif message['role'] == 'assistant' %}\n{{ '### Assistant:\n'  + message['content'] }}\n{% endif %}\n{% if loop.last and add_generation_prompt %}\n{{ '### Assistant:' }}\n{% endif %}\n{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `### User:\nHello, how are you?\n### Assistant:\nI'm doing great. How can I help you today?\n### User:\nI'd like to show off how chat templating works!\n`,
	},
	"Qwen/Qwen1.5-72B-Chat": {
		chat_template: `{% for message in messages %}{% if loop.first and messages[0]['role'] != 'system' %}{{ '<|im_start|>system\nYou are a helpful assistant<|im_end|>\n' }}{% endif %}{{'<|im_start|>' + message['role'] + '\n' + message['content']}}{% if (loop.last and add_generation_prompt) or not loop.last %}{{ '<|im_end|>' + '\n'}}{% endif %}{% endfor %}{% if add_generation_prompt and messages[-1]['role'] != 'assistant' %}{{ '<|im_start|>assistant\n' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<|im_start|>system\nYou are a helpful assistant<|im_end|>\n<|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!`,
	},
	"deepseek-ai/deepseek-llm-7b-chat": {
		chat_template: `{% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}{{ bos_token }}{% for message in messages %}{% if message['role'] == 'user' %}{{ 'User: ' + message['content'] + '\n\n' }}{% elif message['role'] == 'assistant' %}{{ 'Assistant: ' + message['content'] + eos_token }}{% elif message['role'] == 'system' %}{{ message['content'] + '\n\n' }}{% endif %}{% endfor %}{% if add_generation_prompt %}{{ 'Assistant:' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<｜begin▁of▁sentence｜>",
			eos_token: "<｜end▁of▁sentence｜>",
		},
		target: `<｜begin▁of▁sentence｜>User: Hello, how are you?\n\nAssistant: I'm doing great. How can I help you today?<｜end▁of▁sentence｜>User: I'd like to show off how chat templating works!\n\n`,
	},
	"h2oai/h2o-danube-1.8b-chat": {
		chat_template: `{% for message in messages %}{% if message['role'] == 'user' %}{{ '<|prompt|>' + message['content'] + eos_token }}{% elif message['role'] == 'system' %}{{ '<|system|>' + message['content'] + eos_token }}{% elif message['role'] == 'assistant' %}{{ '<|answer|>'  + message['content'] + eos_token }}{% endif %}{% if loop.last and add_generation_prompt %}{{ '<|answer|>' }}{% endif %}{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<|prompt|>Hello, how are you?</s><|answer|>I'm doing great. How can I help you today?</s><|prompt|>I'd like to show off how chat templating works!</s>`,
	},
	"internlm/internlm2-chat-7b": {
		chat_template: `{% if messages[0]['role'] == 'user' or messages[0]['role'] == 'system' %}{{ bos_token }}{% endif %}{% for message in messages %}{{ '<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n' }}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% elif messages[-1]['role'] == 'assistant' %}{{ eos_token }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<s><|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!<|im_end|>\n`,
	},
	"TheBloke/deepseek-coder-33B-instruct-AWQ": {
		chat_template: `{%- set found_item = false -%}\n{%- for message in messages -%}\n    {%- if message['role'] == 'system' -%}\n        {%- set found_item = true -%}\n    {%- endif -%}\n{%- endfor -%}\n{%- if not found_item -%}\n{{'You are an AI programming assistant, utilizing the Deepseek Coder model, developed by Deepseek Company, and you only answer questions related to computer science. For politically sensitive questions, security and privacy issues, and other non-computer science questions, you will refuse to answer.\\n'}}\n{%- endif %}\n{%- for message in messages %}\n    {%- if message['role'] == 'system' %}\n{{ message['content'] }}\n    {%- else %}\n        {%- if message['role'] == 'user' %}\n{{'### Instruction:\\n' + message['content'] + '\\n'}}\n        {%- else %}\n{{'### Response:\\n' + message['content'] + '\\n<|EOT|>\\n'}}\n        {%- endif %}\n    {%- endif %}\n{%- endfor %}\n{{'### Response:\\n'}}\n`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<｜begin▁of▁sentence｜>",
			eos_token: "<|EOT|>",
		},
		target: `You are an AI programming assistant, utilizing the Deepseek Coder model, developed by Deepseek Company, and you only answer questions related to computer science. For politically sensitive questions, security and privacy issues, and other non-computer science questions, you will refuse to answer.\n### Instruction:\nHello, how are you?\n### Response:\nI'm doing great. How can I help you today?\n<|EOT|>\n### Instruction:\nI'd like to show off how chat templating works!\n### Response:\n`,
	},
	"ericzzz/falcon-rw-1b-chat": {
		chat_template: `{% for message in messages %}{% if loop.index > 1 and loop.previtem['role'] != 'assistant' %}{{ ' ' }}{% endif %}{% if message['role'] == 'system' %}{{ '[SYS] ' + message['content'].strip() }}{% elif message['role'] == 'user' %}{{ '[INST] ' + message['content'].strip() }}{% elif message['role'] == 'assistant' %}{{ '[RESP] '  + message['content'] + eos_token }}{% endif %}{% endfor %}{% if add_generation_prompt %}{{ ' [RESP] ' }}{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<|endoftext|>",
			eos_token: "<|endoftext|>",
			add_generation_prompt: false,
		},
		target: `[INST] Hello, how are you? [RESP] I'm doing great. How can I help you today?<|endoftext|>[INST] I'd like to show off how chat templating works!`,
	},
	"abacusai/Smaug-34B-v0.1": {
		chat_template: `{%- for idx in range(0, messages|length) -%}\n{%- if messages[idx]['role'] == 'user' -%}\n{%- if idx > 1 -%}\n{{- bos_token + '[INST] ' + messages[idx]['content'] + ' [/INST]' -}}\n{%- else -%}\n{{- messages[idx]['content'] + ' [/INST]' -}}\n{%- endif -%}\n{% elif messages[idx]['role'] == 'system' %}\n{{- '[INST] <<SYS>>\\n' + messages[idx]['content'] + '\\n<</SYS>>\\n\\n' -}}\n{%- elif messages[idx]['role'] == 'assistant' -%}\n{{- ' '  + messages[idx]['content'] + ' ' + eos_token -}}\n{% endif %}\n{% endfor %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `Hello, how are you? [/INST] I'm doing great. How can I help you today? </s><s>[INST] I'd like to show off how chat templating works! [/INST]`,
	},
	"maywell/Synatra-Mixtral-8x7B": {
		chat_template: `Below is an instruction that describes a task. Write a response that appropriately completes the request.\n\n{% for message in messages %}{% if message['role'] == 'user' %}### Instruction:\n{{ message['content']|trim -}}{% if not loop.last %}{% endif %}\n{% elif message['role'] == 'assistant' %}### Response:\n{{ message['content']|trim -}}{% if not loop.last %}{% endif %}\n{% elif message['role'] == 'system' %}{{ message['content']|trim -}}{% if not loop.last %}{% endif %}\n{% endif %}\n{% endfor %}\n{% if add_generation_prompt and messages[-1]['role'] != 'assistant' %}\n### Response:\n{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `Below is an instruction that describes a task. Write a response that appropriately completes the request.\n\n### Instruction:\nHello, how are you?### Response:\nI'm doing great. How can I help you today?### Instruction:\nI'd like to show off how chat templating works!`,
	},
	"deepseek-ai/deepseek-coder-33b-instruct": {
		chat_template: `{% if not add_generation_prompt is defined %}\n{% set add_generation_prompt = false %}\n{% endif %}\n{%- set ns = namespace(found=false) -%}\n{%- for message in messages -%}\n    {%- if message['role'] == 'system' -%}\n        {%- set ns.found = true -%}\n    {%- endif -%}\n{%- endfor -%}\n{{bos_token}}{%- if not ns.found -%}\n{{'You are an AI programming assistant, utilizing the Deepseek Coder model, developed by Deepseek Company, and you only answer questions related to computer science. For politically sensitive questions, security and privacy issues, and other non-computer science questions, you will refuse to answer\\n'}}\n{%- endif %}\n{%- for message in messages %}\n    {%- if message['role'] == 'system' %}\n{{ message['content'] }}\n    {%- else %}\n        {%- if message['role'] == 'user' %}\n{{'### Instruction:\\n' + message['content'] + '\\n'}}\n        {%- else %}\n{{'### Response:\\n' + message['content'] + '\\n<|EOT|>\\n'}}\n        {%- endif %}\n    {%- endif %}\n{%- endfor %}\n{% if add_generation_prompt %}\n{{'### Response:'}}\n{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<｜begin▁of▁sentence｜>",
			eos_token: "<|EOT|>",
		},
		target: `<｜begin▁of▁sentence｜>You are an AI programming assistant, utilizing the Deepseek Coder model, developed by Deepseek Company, and you only answer questions related to computer science. For politically sensitive questions, security and privacy issues, and other non-computer science questions, you will refuse to answer\n### Instruction:\nHello, how are you?\n### Response:\nI'm doing great. How can I help you today?\n<|EOT|>\n### Instruction:\nI'd like to show off how chat templating works!\n`,
	},
	"meetkai/functionary-medium-v2.2": {
		chat_template: `{#v2.2#}\n{% for message in messages %}\n{% if message['role'] == 'user' or message['role'] == 'system' %}\n{{ '<|from|>' + message['role'] + '\n<|recipient|>all\n<|content|>' + message['content'] + '\n' }}{% elif message['role'] == 'tool' %}\n{{ '<|from|>' + message['name'] + '\n<|recipient|>all\n<|content|>' + message['content'] + '\n' }}{% else %}\n{% set contain_content='no'%}\n{% if message['content'] is not none %}\n{{ '<|from|>assistant\n<|recipient|>all\n<|content|>' + message['content'] }}{% set contain_content='yes'%}\n{% endif %}\n{% if 'tool_calls' in message and message['tool_calls'] is not none %}\n{% for tool_call in message['tool_calls'] %}\n{% set prompt='<|from|>assistant\n<|recipient|>' + tool_call['function']['name'] + '\n<|content|>' + tool_call['function']['arguments'] %}\n{% if loop.index == 1 and contain_content == "no" %}\n{{ prompt }}{% else %}\n{{ '\n' + prompt}}{% endif %}\n{% endfor %}\n{% endif %}\n{{ '<|stop|>\n' }}{% endif %}\n{% endfor %}\n{% if add_generation_prompt %}{{ '<|from|>assistant\n<|recipient|>' }}{% endif %}`,
		data: {
			messages: EXAMPLE_FUNCTION_CALLING,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<|from|>assistant\n<|recipient|>get_current_weather\n<|content|>{\n  "location": "Hanoi"\n}<|stop|>\n<|from|>user\n<|recipient|>all\n<|content|>what's the weather like in Hanoi?\n`,
	},
	"fireworks-ai/firefunction-v1": {
		chat_template: `{%- set message_roles = ['SYSTEM', 'FUNCTIONS', 'USER', 'ASSISTANT', 'TOOL'] -%}\n{%- set ns = namespace(seen_non_system=false, messages=messages, content='', functions=[]) -%}\n{{ bos_token }}\n{#- Basic consistency checks -#}\n{%- if not ns.messages -%}\n  {{ raise_exception('No messages') }}\n{%- endif -%}\n{%- if ns.messages[0]['role'] | upper != 'SYSTEM' -%}\n  {%- set ns.messages = [{'role': 'SYSTEM', 'content': 'You are a helpful assistant with access to functions. Use them if required.'}] + ns.messages -%}\n{%- endif -%}\n{%- if ns.messages | length < 2 or ns.messages[0]['role'] | upper != 'SYSTEM' or ns.messages[1]['role'] | upper != 'FUNCTIONS' -%}\n  {{ raise_exception('Expected either "functions" or ["system", "functions"] as the first messages') }}\n{%- endif -%}\n{%- for message in ns.messages -%}\n  {%- set role = message['role'] | upper -%}\n  {#- Validation -#}\n  {%- if role not in message_roles -%}\n    {{ raise_exception('Invalid role ' + message['role'] + '. Only ' + message_roles + ' are supported.') }}\n  {%- endif -%}\n  {%- set ns.content = message['content'] if message.get('content') else '' -%}\n  {#- Move tool calls inside the content -#}\n  {%- if 'tool_calls' in message -%}\n    {%- for call in message['tool_calls'] -%}\n      {%- set ns.content = ns.content + '<functioncall>{"name": "' + call['function']['name'] + '", "arguments": ' + call['function']['arguments'] + '}' -%}\n    {%- endfor -%}\n  {%- endif -%}\n  {%- if role == 'ASSISTANT' and '<functioncall>' not in ns.content -%}\n    {%- set ns.content = '<plain>' + ns.content -%}\n  {%- endif -%}\n  {%- if role == 'ASSISTANT' -%}\n    {%- set ns.content = ns.content + eos_token -%}\n  {%- endif -%}\n  {{ role }}: {{ ns.content }}{{ '\\n\\n' }}\n{%- endfor -%}\nASSISTANT:{{ ' ' }}\n`,
		data: {
			messages: EXAMPLE_FUNCTION_CALLING_WITH_SYSTEM,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		target: `<s>SYSTEM: You are a helpful assistant with access to functions. Use them if required.\n\nFUNCTIONS: [\n    {\n        "name": "get_stock_price",\n        "description": "Get the current stock price",\n        "parameters": {\n            "type": "object",\n            "properties": {\n                "symbol": {\n                    "type": "string",\n                    "description": "The stock symbol, e.g. AAPL, GOOG"\n                }\n            },\n            "required": [\n                "symbol"\n            ]\n        }\n    },\n    {\n        "name": "check_word_anagram",\n        "description": "Check if two words are anagrams of each other",\n        "parameters": {\n            "type": "object",\n            "properties": {\n                "word1": {\n                    "type": "string",\n                    "description": "The first word"\n                },\n                "word2": {\n                    "type": "string",\n                    "description": "The second word"\n                }\n            },\n            "required": [\n                "word1",\n                "word2"\n            ]\n        }\n    }\n]\n\nSYSTEM: You are a helpful assistant with access to functions. Use them if required.\n\nUSER: Hi, can you tell me the current stock price of AAPL?\n\nASSISTANT: `,
	},
	"maywell/PiVoT-MoE": {
		chat_template: `{{ (messages|selectattr('role', 'equalto', 'system')|list|last).content|trim if (messages|selectattr('role', 'equalto', 'system')|list) else '' }}{% for message in messages %}{% if message['role'] == 'system' %}{{ message['content']|trim }}{% elif message['role'] == 'user' %}### Instruction: {{ message['content']|trim }}{% elif message['role'] == 'assistant' %}### Response: {{ message['content']|trim }}{% elif message['role'] == 'user_context' %}### Input: {{ message['content']|trim }}{% endif %}{% if not loop.last %}\n{% endif %}{% endfor %}{% if add_generation_prompt and messages[-1]['role'] != 'assistant' %}### Response:{% endif %}`,
		data: {
			messages: EXAMPLE_CHAT_WITH_SYSTEM,
			bos_token: "<s>",
			eos_token: "</s>",
			add_generation_prompt: false,
		},
		// NOTE: There is a bug in the model's chat template which causes the system prompt
		// to be repeated twice. We replicate this behaviour here.
		target: `You are a friendly chatbot who always responds in the style of a pirateYou are a friendly chatbot who always responds in the style of a pirate### Instruction: Hello, how are you?### Response: I'm doing great. How can I help you today?### Instruction: I'd like to show off how chat templating works!`,
	},
	"CohereForAI/c4ai-command-r-v01": {
		chat_template:
			`{{ bos_token }}{% if messages[0]['role'] == 'system' %}{% set loop_messages = messages[1:] %}{% set system_message = messages[0]['content'] %}{% else %}{% set loop_messages = messages %}{% set system_message = '## Task and Context\\nYou help people answer their questions and other requests interactively. You will be asked a very wide array of requests on all kinds of topics. You will be equipped with a wide range of search engines or similar tools to help you, which you use to research your answer. You should focus on serving the user\\'s needs as best you can, which will be wide-ranging.\\n\\n## Style Guide\\nUnless the user asks for a different style of answer, you should answer in full sentences, using proper grammar and spelling.' %}{% endif %}` +
			`{{ '<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>' }}{{ '# Safety Preamble' }}{{ '\nThe instructions in this section override those in the task description and style guide sections. Don\\'t answer questions that are harmful or immoral.' }}{{ '\n\n# System Preamble' }}{{ '\n## Basic Rules' }}{{ '\nYou are a powerful conversational AI trained by Cohere to help people. You are augmented by a number of tools, and your job is to use and consume the output of these tools to best help the user. You will see a conversation history between yourself and a user, ending with an utterance from the user. You will then see a specific instruction instructing you what kind of response to generate. When you answer the user\\'s requests, you cite your sources in your answers, according to those instructions.' }}` +
			`{{ '\n\n# User Preamble' }}{{ '\n' + system_message }}` +
			`{{'\n\n## Available Tools\nHere is a list of tools that you have available to you:\n\n'}}{% for tool in tools %}{% if loop.index0 != 0 %}{{ '\n\n'}}{% endif %}{{'\`\`\`python\ndef ' + tool.name + '('}}{% for param_name, param_fields in tool.parameter_definitions.items() %}{% if loop.index0 != 0 %}{{ ', '}}{% endif %}{{param_name}}: {% if not param_fields.required %}{{'Optional[' + param_fields.type + '] = None'}}{% else %}{{ param_fields.type }}{% endif %}{% endfor %}{{ ') -> List[Dict]:\n    """'}}{{ tool.description }}{% if tool.parameter_definitions|length != 0 %}{{ '\n\n    Args:\n        '}}{% for param_name, param_fields in tool.parameter_definitions.items() %}{% if loop.index0 != 0 %}{{ '\n        ' }}{% endif %}{{ param_name + ' ('}}{% if not param_fields.required %}{{'Optional[' + param_fields.type + ']'}}{% else %}{{ param_fields.type }}{% endif %}{{ '): ' + param_fields.description }}{% endfor %}{% endif %}{{ '\n    """\n    pass\n\`\`\`' }}{% endfor %}{{ '<|END_OF_TURN_TOKEN|>'}}` +
			`{% for message in loop_messages %}{% set content = message['content'] %}{% if message['role'] == 'user' %}{{ '<|START_OF_TURN_TOKEN|><|USER_TOKEN|>' + content.strip() + '<|END_OF_TURN_TOKEN|>' }}{% elif message['role'] == 'system' %}{{ '<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>' + content.strip() + '<|END_OF_TURN_TOKEN|>' }}{% elif message['role'] == 'assistant' %}{{ '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>'  + content.strip() + '<|END_OF_TURN_TOKEN|>' }}{% endif %}{% endfor %}` +
			`{{'<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>Write \\'Action:\\' followed by a json-formatted list of actions that you want to perform in order to produce a good response to the user\\'s last input. You can use any of the supplied tools any number of times, but you should aim to execute the minimum number of necessary actions for the input. You should use the \`directly-answer\` tool if calling the other tools is unnecessary. The list of actions you want to call should be formatted as a list of json objects, for example:\n\`\`\`json\n[\n    {\n        "tool_name": title of the tool in the specification,\n        "parameters": a dict of parameters to input into the tool as they are defined in the specs, or {} if it takes no parameters\n    }\n]\`\`\`<|END_OF_TURN_TOKEN|>'}}{% if add_generation_prompt %}{{ '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>' }}{% endif %}`,

		data: {
			messages: [{ role: "user", content: "Whats the biggest penguin in the world?" }],
			tools: [
				{
					name: "internet_search",
					description: "Returns a list of relevant document snippets for a textual query retrieved from the internet",
					parameter_definitions: {
						query: {
							description: "Query to search the internet with",
							type: "str",
							required: true,
						},
					},
				},
				{
					name: "directly_answer",
					description:
						"Calls a standard (un-augmented) AI chatbot to generate a response given the conversation history",
					parameter_definitions: {},
				},
			],
			bos_token: "<BOS_TOKEN>",
			add_generation_prompt: true,
		},
		target:
			"<BOS_TOKEN><|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|># Safety Preamble\nThe instructions in this section override those in the task description and style guide sections. Don't answer questions that are harmful or immoral.\n\n# System Preamble\n## Basic Rules\nYou are a powerful conversational AI trained by Cohere to help people. You are augmented by a number of tools, and your job is to use and consume the output of these tools to best help the user. You will see a conversation history between yourself and a user, ending with an utterance from the user. You will then see a specific instruction instructing you what kind of response to generate. When you answer the user's requests, you cite your sources in your answers, according to those instructions." +
			"\n\n# User Preamble\n## Task and Context\nYou help people answer their questions and other requests interactively. You will be asked a very wide array of requests on all kinds of topics. You will be equipped with a wide range of search engines or similar tools to help you, which you use to research your answer. You should focus on serving the user's needs as best you can, which will be wide-ranging.\n\n## Style Guide\nUnless the user asks for a different style of answer, you should answer in full sentences, using proper grammar and spelling." +
			'\n\n## Available Tools\nHere is a list of tools that you have available to you:\n\n```python\ndef internet_search(query: str) -> List[Dict]:\n    """Returns a list of relevant document snippets for a textual query retrieved from the internet\n\n    Args:\n        query (str): Query to search the internet with\n    """\n    pass\n```\n\n```python\ndef directly_answer() -> List[Dict]:\n    """Calls a standard (un-augmented) AI chatbot to generate a response given the conversation history\n    """\n    pass\n```<|END_OF_TURN_TOKEN|>' +
			"<|START_OF_TURN_TOKEN|><|USER_TOKEN|>Whats the biggest penguin in the world?<|END_OF_TURN_TOKEN|>" +
			'<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>Write \'Action:\' followed by a json-formatted list of actions that you want to perform in order to produce a good response to the user\'s last input. You can use any of the supplied tools any number of times, but you should aim to execute the minimum number of necessary actions for the input. You should use the `directly-answer` tool if calling the other tools is unnecessary. The list of actions you want to call should be formatted as a list of json objects, for example:\n```json\n[\n    {\n        "tool_name": title of the tool in the specification,\n        "parameters": a dict of parameters to input into the tool as they are defined in the specs, or {} if it takes no parameters\n    }\n]```<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>',
	},
	"CohereForAI/c4ai-command-r-v01 (JSON Schema)": {
		chat_template:
			'\n{%- macro json_to_python_type(json_spec) %}\n{%- set basic_type_map = {\n    "string": "str",\n    "number": "float",\n    "integer": "int",\n    "boolean": "bool"\n} %}\n\n{%- if basic_type_map[json_spec.type] is defined %}\n    {{- basic_type_map[json_spec.type] }}\n{%- elif json_spec.type == "array" %}\n    {{- "List[" +  json_to_python_type(json_spec.items) + "]"}}\n{%- elif json_spec.type == "object" %}\n    {{- "Dict[str, " + json_to_python_type(json_spec.additionalProperties) + \']\'}}\n{%- elif json_spec.type is iterable %}\n    {{- "Union[" }}\n    {%- for t in json_spec.type %}\n      {{- json_to_python_type({"type": t}) }}\n      {%- if not loop.last %}\n        {{- "," }} \n    {%- endif %}\n    {%- endfor %}\n    {{- "]" }}\n{%- else %}\n    {{- "Any" }}\n{%- endif %}\n{%- endmacro %}\n' +
			"\n{%- macro old_tool_parser(tools) %}\n{%- for tool in tools %}\n    {%- if loop.index0 != 0 %}\n        {{- '\\n\\n' }}\n    {%- endif %}\n    {{- '```python\\ndef ' + tool.name + '(' }}\n    {%- for param_name, param_fields in tool.parameter_definitions.items() %}\n        {%- if loop.index0 != 0 %}\n            {{- ', '}}\n        {%- endif %}\n        {{- param_name + ': ' }}\n        {%- if not param_fields.required %}\n            {{- 'Optional[' + param_fields.type + '] = None'}}\n        {%- else %}\n            {{- param_fields.type }}\n        {%- endif %}\n    {%- endfor %}\n    {{- ') -> List[Dict]:\\n    \"\"\"'}}\n    {{- tool.description }}\n    {%- if tool.parameter_definitions|length != 0 %}\n        {{- '\\n\\n    Args:\\n        '}}\n        {%- for param_name, param_fields in tool.parameter_definitions.items() %}\n            {%- if loop.index0 != 0 %}\n                {{- '\\n        ' }}\n            {%- endif %}\n            {{- param_name + ' ('}}\n            {%- if not param_fields.required %}\n                {{- 'Optional[' + param_fields.type + ']'}}\n            {%- else %}\n                {{- param_fields.type }}\n            {%- endif %}\n            {{- '): ' + param_fields.description }}\n        {%- endfor %}\n    {%- endif %}\n    {{- '\\n    \"\"\"\\n    pass\\n```' }}\n{%- endfor %}\n{%- endmacro %}\n" +
			"\n{%- macro new_tool_parser(tools) %}\n{%- for tool in tools %}\n  {%- if loop.index0 != 0 %}\n    {{- '\\n\\n'}}\n  {%- endif %}\n  {%- if tool.function is defined %}\n    {%- set tool = tool.function %}\n  {%- endif %}\n  {{-'```python\ndef ' + tool.name + '('}}\n  {%- for param_name, param_fields in tool.parameters.properties.items() %}\n    {%- if loop.index0 != 0 %}\n      {{- ', '}}\n    {%- endif %}\n    {{-param_name + \": \"}} \n    {%- if not param_name in tool.parameters.required %}\n      {{-'Optional[' + json_to_python_type(param_fields) + '] = None'}}\n    {%- else %}\n      {{- json_to_python_type(param_fields) }}\n    {%- endif %}\n  {%- endfor %}\n  {{- ') -> List[Dict]:\n    \"\"\"'}}\n  {{- tool.description }}\n  {%- if tool.parameters.properties|length != 0 %}\n    {{- '\\n\\n    Args:\\n        '}}\n    {%- for param_name, param_fields in tool.parameters.properties.items() %}\n      {%- if loop.index0 != 0 %}\n        {{- '\\n        ' }}\n      {%- endif %}\n      {{- param_name + ' ('}}\n      {%- if not param_name in tool.parameters.required %}\n        {{-'Optional[' + json_to_python_type(param_fields) + ']'}}\n      {%- else %}\n        {{- json_to_python_type(param_fields) }}\n      {%- endif %}\n      {{- '): ' + param_fields.description }}\n    {%- endfor %}\n    {%- endif %}\n    {{- '\\n    \"\"\"\\n    pass\\n```' }}\n{%- endfor %}\n{%- endmacro %}\n" +
			"\n{{- bos_token }}\n{%- if messages[0]['role'] == 'system' %}\n  {%- set loop_messages = messages[1:] %}\n  {%- set system_message = messages[0]['content'] %}\n{%- else %}\n  {%- set loop_messages = messages %}\n  {%- set system_message = '## Task and Context\\nYou help people answer their questions and other requests interactively. You will be asked a very wide array of requests on all kinds of topics. You will be equipped with a wide range of search engines or similar tools to help you, which you use to research your answer. You should focus on serving the user\\'s needs as best you can, which will be wide-ranging.\\n\\n## Style Guide\\nUnless the user asks for a different style of answer, you should answer in full sentences, using proper grammar and spelling.' %}\n{%- endif %}" +
			"\n{{- '<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>' }}\n{{- '# Safety Preamble' }}\n{{- '\nThe instructions in this section override those in the task description and style guide sections. Don\\'t answer questions that are harmful or immoral.' }}\n{{- '\n\n# System Preamble' }}\n{{- '\n## Basic Rules' }}\n{{- '\nYou are a powerful conversational AI trained by Cohere to help people. You are augmented by a number of tools, and your job is to use and consume the output of these tools to best help the user. You will see a conversation history between yourself and a user, ending with an utterance from the user. You will then see a specific instruction instructing you what kind of response to generate. When you answer the user\\'s requests, you cite your sources in your answers, according to those instructions.' }}\n{{- '\n\n# User Preamble' }}\n{{- '\n' + system_message }}\n{{-'\n\n## Available Tools\nHere is a list of tools that you have available to you:\n\n'}}\n{%- set ns = namespace(new_tools=true) %}\n{%- for tool in tools %}\n    {%- if tool.parameter_definitions is defined %}\n        {%- set ns.new_tools = false %}\n    {%- endif %}\n{%- endfor %}\n{%- if ns.new_tools %}\n    {{- new_tool_parser(tools) }}\n{%- else %}\n    {{- old_tool_parser(tools) }}\n{%- endif %}\n{{- '<|END_OF_TURN_TOKEN|>'}}\n{%- for message in loop_messages %}\n  {%- set content = message['content'] %}\n  {%- if message.role == 'user' %}" +
			"\n    {{- '<|START_OF_TURN_TOKEN|><|USER_TOKEN|>' + content.strip() + '<|END_OF_TURN_TOKEN|>' }}\n  {%- elif message.role == 'system' %}" +
			"\n    {{- '<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>' + content.strip() + '<|END_OF_TURN_TOKEN|>' }}\n  {%- elif message.role == 'assistant' and message.tool_calls is defined %}" +
			"\n    {{- '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>' }}\n    {%- if message.content is defined %}\n        {{- message.content.strip() }}\n    {%- endif %}\n    {{- '\\nAction:\\n```json\\n[\\n' }}\n    {%- for tool_call in message.tool_calls %}\n        {%- if tool_call.function is defined %}\n            {%- set tool_call = tool_call.function %}\n        {%- endif %}\n        {{- '{\\n'|indent(4, first=True) }}\n        {{- '\"tool_name\": \"'|indent(8, first=True) + tool_call.name + '\",\\n' }}\n        {{- '\"parameters\": '|indent(8, first=True) }}\n        {%- if tool_call.arguments is defined and tool_call.arguments|length > 0 %}    \n            {{- tool_call.arguments|tojson(indent=4)|indent(8) }}\n            {{- '\\n' }}\n        {%- else %}\n            {{- '{}\\n' }}\n        {%- endif %}\n        {{- '}'|indent(4, first=True) }}\n        {%- if not loop.last %}\n            {{- ',\\n' }}\n        {%- endif %}\n    {%- endfor %}\n    {{- \"\\n]```\\n\" }}\n  {%- elif message.role == 'assistant' %}" +
			"\n    {{- '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>'  + content.strip() + '<|END_OF_TURN_TOKEN|>' }}\n  {%- elif message.role == 'tool' %}" +
			"\n    {{- '<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|><results>\\n' }}\n    {{- message.content.strip() }}\n    {{- '</results><|END_OF_TURN_TOKEN|>' }}\n  {%- endif %}\n{%- endfor %}" +
			"\n{{-'<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>Write \\'Action:\\' followed by a json-formatted list of actions that you want to perform in order to produce a good response to the user\\'s last input. You can use any of the supplied tools any number of times, but you should aim to execute the minimum number of necessary actions for the input. You should use the `directly-answer` tool if calling the other tools is unnecessary. The list of actions you want to call should be formatted as a list of json objects, for example:\n```json\n[\n    {\n        \"tool_name\": title of the tool in the specification,\n        \"parameters\": a dict of parameters to input into the tool as they are defined in the specs, or {} if it takes no parameters\n    }\n]```<|END_OF_TURN_TOKEN|>'}}\n{%- if add_generation_prompt %}" +
			"\n  {{- '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>' }}\n{%- endif %}\n",
		data: {
			messages: [
				{ role: "user", content: "Whats the biggest penguin in the world?" },
				{
					role: "assistant",
					tool_calls: [
						{
							type: "function",
							function: { name: "internet_search", arguments: { query: "biggest penguin species" } },
						},
					],
				},
				{ role: "tool", content: "Tool results go here!" },
			],
			tools: [
				{
					type: "function",
					function: {
						name: "internet_search",
						description: "Returns a list of relevant document snippets for a textual query retrieved from the internet",
						parameters: {
							type: "object",
							properties: { query: { type: "string", description: "Query to search the internet with" } },
							required: ["query"],
						},
					},
				},
				{
					type: "function",
					function: {
						name: "directly_answer",
						description:
							"Calls a standard (un-augmented) AI chatbot to generate a response given the conversation history",
						parameters: { type: "object", properties: {} },
					},
				},
			],
			bos_token: "<BOS_TOKEN>",
			add_generation_prompt: true,
		},
		target:
			"<BOS_TOKEN>" +
			'<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|># Safety Preamble\nThe instructions in this section override those in the task description and style guide sections. Don\'t answer questions that are harmful or immoral.\n\n# System Preamble\n## Basic Rules\nYou are a powerful conversational AI trained by Cohere to help people. You are augmented by a number of tools, and your job is to use and consume the output of these tools to best help the user. You will see a conversation history between yourself and a user, ending with an utterance from the user. You will then see a specific instruction instructing you what kind of response to generate. When you answer the user\'s requests, you cite your sources in your answers, according to those instructions.\n\n# User Preamble\n## Task and Context\nYou help people answer their questions and other requests interactively. You will be asked a very wide array of requests on all kinds of topics. You will be equipped with a wide range of search engines or similar tools to help you, which you use to research your answer. You should focus on serving the user\'s needs as best you can, which will be wide-ranging.\n\n## Style Guide\nUnless the user asks for a different style of answer, you should answer in full sentences, using proper grammar and spelling.\n\n## Available Tools\nHere is a list of tools that you have available to you:\n\n```python\ndef internet_search(query: str) -> List[Dict]:\n    """Returns a list of relevant document snippets for a textual query retrieved from the internet\n\n    Args:\n        query (str): Query to search the internet with\n    """\n    pass\n```\n\n```python\ndef directly_answer() -> List[Dict]:\n    """Calls a standard (un-augmented) AI chatbot to generate a response given the conversation history\n    """\n    pass\n```<|END_OF_TURN_TOKEN|>' +
			"<|START_OF_TURN_TOKEN|><|USER_TOKEN|>Whats the biggest penguin in the world?<|END_OF_TURN_TOKEN|>" +
			'<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>\nAction:\n```json\n[\n    {\n        "tool_name": "internet_search",\n        "parameters": {\n            "query": "biggest penguin species"\n        }\n    }\n]```\n' +
			"<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|><results>\nTool results go here!</results><|END_OF_TURN_TOKEN|>" +
			'<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>Write \'Action:\' followed by a json-formatted list of actions that you want to perform in order to produce a good response to the user\'s last input. You can use any of the supplied tools any number of times, but you should aim to execute the minimum number of necessary actions for the input. You should use the `directly-answer` tool if calling the other tools is unnecessary. The list of actions you want to call should be formatted as a list of json objects, for example:\n```json\n[\n    {\n        "tool_name": title of the tool in the specification,\n        "parameters": a dict of parameters to input into the tool as they are defined in the specs, or {} if it takes no parameters\n    }\n]```<|END_OF_TURN_TOKEN|>' +
			"<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>",
	},
	"mistralai/Mistral-7B-Instruct-v0.3 (JSON Schema)": {
		chat_template:
			"{{- bos_token }}\n{%- set user_messages = messages | selectattr('role', 'equalto', 'user') | list %}\n{%- for message in messages %}\n    {%- if message['role'] == 'user' %}\n        {%- if tools and (message == user_messages[-1]) %}\n            {{- ' [AVAILABLE_TOOLS] [' }}\n            {%- for tool in tools %}\n\t\t{%- set tool = tool.function %}\n\t\t{{- '{\"type\": \"function\", \"function\": {' }}\n\t\t{%- for key, val in tool|items if key != \"return\" %}\n\t\t    {%- if val is string %}\n\t\t\t{{- '\"' + key + '\": \"' + val + '\"' }}\n\t\t    {%- else %}\n\t\t\t{{- '\"' + key + '\": ' + val|tojson }}\n\t\t    {%- endif %}\n\t\t    {%- if not loop.last %}\n\t\t\t{{- \", \" }}\n\t\t    {%- endif %}\n\t\t{%- endfor %}\n\t\t{{- \"}}\" }}\n                {%- if not loop.last %}\n                    {{- \", \" }}\n                {%- else %}\n                    {{- \"]\" }}\n                {%- endif %}\n            {%- endfor %}\n            {{- ' [/AVAILABLE_TOOLS]' }}\n            {%- endif %}\n        {{- ' [INST] ' + message['content'] + ' [/INST]' }}\n    {%- elif message['role'] == 'assistant' %}\n        {%- if message.tool_calls is defined and message.tool_calls|length > 0 %}\n            {{- ' [TOOL_CALLS] [' }}\n            {%- for tool_call in message.tool_calls %}\n                {{- {\"name\": tool_call.function.name, \"arguments\": tool_call.function.arguments, \"id\": tool_call.id}|tojson }}\n                {%- if not loop.last %}\n                    {{- \", \" }}\n                {%- endif %}\n            {%- endfor %}\n            {{- '] ' }}\n            {{- eos_token }}\n    \t{%- elif message.content is defined %}\n\t    {{- ' ' + message.content + ' ' + eos_token}}\n        {%- endif %}\n    {%- elif message['role'] == 'tool' %}\n        {{- ' [TOOL_RESULTS] ' }}\n        {{- '{\"call_id\": \"' + message.tool_call_id + '\", \"content\": ' + message.content|string + '}' }}\n        {{- ' [/TOOL_RESULTS] ' }}\n    {%- endif %}\n{%- endfor %}\n",
		data: {
			messages: [
				{
					role: "system",
					content:
						"You are a bot that responds to weather queries. You should reply with the unit used in the queried location.",
				},
				{ role: "user", content: "Hey, what's the temperature in Paris right now?" },
				{
					role: "assistant",
					tool_calls: [
						{
							id: "abcdef123",
							type: "function",
							function: { name: "get_current_temperature", arguments: { location: "Paris, France", unit: "celsius" } },
						},
					],
				},
				{ role: "tool", tool_call_id: "abcdef123", name: "get_current_temperature", content: "22.0" },
			],
			tools: EXAMPLE_LIST_OF_TOOLS,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target:
			'<s> [AVAILABLE_TOOLS] [{"type": "function", "function": {"name": "get_current_temperature", "description": "Get the current temperature at a location.", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "The location to get the temperature for, in the format \\"City, Country\\""}, "unit": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "The unit to return the temperature in."}}, "required": ["location", "unit"]}}}, {"type": "function", "function": {"name": "get_current_wind_speed", "description": "Get the current wind speed in km/h at a given location.", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "The location to get the temperature for, in the format \\"City, Country\\""}}, "required": ["location"]}}}] [/AVAILABLE_TOOLS] [INST] Hey, what\'s the temperature in Paris right now? [/INST] [TOOL_CALLS] [{"name": "get_current_temperature", "arguments": {"location": "Paris, France", "unit": "celsius"}, "id": "abcdef123"}] </s> [TOOL_RESULTS] {"call_id": "abcdef123", "content": 22.0} [/TOOL_RESULTS] ',
	},
	"CISCai/Mistral-7B-Instruct-v0.3-SOTA-GGUF": {
		chat_template: `{{ bos_token }}{% set ns = namespace(lastuser=-1, system=false, functions=false) %}{% if tools %}{% for message in messages %}{% if message['role'] == 'user' %}{% set ns.lastuser = loop.index0 %}{% elif message['role'] == 'system' %}{% set ns.system = message['content'] %}{% endif %}{% endfor %}{% set ns.functions = tools|selectattr('type','eq','function')|map(attribute='function')|list|tojson %}{% endif %}{% for message in messages %}{% if message['role'] == 'user' %}{% if loop.index0 == ns.lastuser and ns.functions %}{{ '[AVAILABLE_TOOLS] ' }}{{ ns.functions }}{{ '[/AVAILABLE_TOOLS]' }}{% endif %}{{ '[INST] ' }}{% if loop.index0 == ns.lastuser and ns.system %}{{ ns.system + ' ' }}{% endif %}{{ message['content'] }}{{ '[/INST]' }}{% elif message['role'] == 'tool' %}{{ '[TOOL_RESULTS] ' }}{{ dict(call_id=message['tool_call_id'], content=message['content'])|tojson }}{{ '[/TOOL_RESULTS]' }}{% elif message['role'] == 'assistant' %}{% if message['tool_calls'] %}{{ '[TOOL_CALLS] [' }}{% for call in message['tool_calls'] %}{% if call['type'] == 'function' %}{{ dict(id=call['id'], name=call['function']['name'], arguments=call['function']['arguments'])|tojson }}{% endif %}{% if not loop.last %}{{ ', ' }}{% endif %}{% endfor %}{{ ']' }}{% else %}{{ message['content'] }}{% endif %}{{ eos_token }}{% endif %}{% endfor %}`,
		data: {
			messages: [
				{
					role: "user",
					content: "What's the weather like in Oslo and Stockholm?",
				},
			],
			tools: [EXAMPLE_TOOL_JSON_SCHEMAS.get_current_weather],
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<s>[AVAILABLE_TOOLS] [{"name": "get_current_weather", "description": "Get the current weather in a given location", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "The city and state, e.g. San Francisco, CA"}, "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}}, "required": ["location"]}}][/AVAILABLE_TOOLS][INST] What's the weather like in Oslo and Stockholm?[/INST]`,
	},
	"NousResearch/Hermes-2-Pro-Llama-3-8B (JSON Schema)": {
		chat_template:
			`{%- macro json_to_python_type(json_spec) %}\n{%- set basic_type_map = {\n    "string": "str",\n    "number": "float",\n    "integer": "int",\n    "boolean": "bool"\n} %}\n\n{%- if basic_type_map[json_spec.type] is defined %}\n    {{- basic_type_map[json_spec.type] }}\n{%- elif json_spec.type == "array" %}\n    {{- "list[" +  json_to_python_type(json_spec|items) + "]"}}\n{%- elif json_spec.type == "object" %}\n    {%- if json_spec.additionalProperties is defined %}\n        {{- "dict[str, " + json_to_python_type(json_spec.additionalProperties) + ']'}}\n    {%- else %}\n        {{- "dict" }}\n    {%- endif %}\n{%- elif json_spec.type is iterable %}\n    {{- "Union[" }}\n    {%- for t in json_spec.type %}\n      {{- json_to_python_type({"type": t}) }}\n      {%- if not loop.last %}\n        {{- "," }} \n    {%- endif %}\n    {%- endfor %}\n    {{- "]" }}\n{%- else %}\n    {{- "Any" }}\n{%- endif %}\n{%- endmacro %}\n\n\n` +
			`{{- bos_token }}\n{{- "You are a function calling AI model. You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Here are the available tools: <tools> " }}\n{%- for tool in tools %}\n    {%- if tool.function is defined %}\n        {%- set tool = tool.function %}\n    {%- endif %}\n    {{- '{"type": "function", "function": ' }}\n    {{- '{"name": ' + tool.name + '", ' }}\n    {{- '"description": "' + tool.name + '(' }}\n    {%- for param_name, param_fields in tool.parameters.properties|items %}\n        {{- param_name + ": " + json_to_python_type(param_fields) }}\n        {%- if not loop.last %}\n            {{- ", " }}\n        {%- endif %}\n    {%- endfor %}\n    {{- ")" }}\n    {%- if tool.return is defined %}\n        {{- " -> " + json_to_python_type(tool.return) }}\n    {%- endif %}\n    {{- " - " + tool.description + "\\n\\n" }}\n    {%- for param_name, param_fields in tool.parameters.properties|items %}\n        {%- if loop.first %}\n            {{- "    Args:\\n" }}\n        {%- endif %}\n        {{- "        " + param_name + "(" + json_to_python_type(param_fields) + "): " + param_fields.description|trim }}\n    {%- endfor %}\n    {%- if tool.return is defined and tool.return.description is defined %}\n        {{- "\\n    Returns:\\n        " + tool.return.description }}\n    {%- endif %}\n    {{- '"' }}\n    {{- ', "parameters": ' }}\n    {%- if tool.parameters.properties | length == 0 %}\n        {{- "{}" }}\n    {%- else %}\n        {{- tool.parameters | tojson}}\n    {%- endif %}\n    {{- "}" }}\n    {%- if not loop.last %}\n        {{- "\\n" }}\n    {%- endif %}\n{%- endfor %}\n{{- " </tools>" }}\n` +
			`{{- 'Use the following pydantic model json schema for each tool call you will make: {"properties": {"arguments": {"title": "Arguments", "type": "object"}, "name": {"title": "Name", "type": "string"}}, "required": ["arguments", "name"], "title": "FunctionCall", "type": "object"}\n' }}\n{{- "For each function call return a json object with function name and arguments within <tool_call></tool_call> XML tags as follows:\n" }}\n{{- "<tool_call>\n" }}\n{{- '{"arguments": <args-dict>, "name": <function-name>}\n' }}\n{{- '</tool_call><|im_end|>' }}\n{%- for message in messages %}\n    {%- if message.role == "user" or message.role == "system" or (message.role == "assistant" and message.tool_calls is not defined) %}\n        ` +
			`{{- '<|im_start|>' + message.role + '\\n' + message.content + '<|im_end|>' + '\\n' }}\n    {%- elif message.role == "assistant" %}\n        {{- '<|im_start|>' + message.role + '\\n<tool_call>\\n' }}\n        {%- for tool_call in message.tool_calls %}\n            {%- if tool_call.function is defined %}\n                {%- set tool_call = tool_call.function %}\n            {%- endif %}\n            {{- '{ ' }}\n            {%- if tool_call.arguments is defined %}\n                {{- '"arguments": ' }}\n                {{- tool_call.arguments|tojson }}\n                {{- ', '}}\n            {%- endif %}\n            {{- '"name": "' }}\n            {{- tool_call.name }}\n            {{- '"}' }}\n            {{- '\\n</tool_call> ' }}\n        {%- endfor %}\n        {{- '<|im_end|>\\n' }}\n    {%- elif message.role == "tool" %}\n        {%- if not message.name is defined %}\n            {{- raise_exception("Tool response dicts require a 'name' key indicating the name of the called function!") }}\n        {%- endif %}\n        {{- '<|im_start|>' + message.role + '\\n<tool_response>\\n' }}\n        {{- '{"name": "' }}\n        {{- message.name }}\n        {{- '", "content": ' }}\n        {{- message.content|tojson + '}' }}\n        {{- '\\n</tool_response> <|im_end|>\\n' }} \n    {%- endif %}\n{%- endfor %}\n{%- if add_generation_prompt %}\n    {{- '<|im_start|>assistant\\n' }}\n{%- endif %}\n`,
		data: {
			messages: [{ role: "user", content: "Fetch the stock fundamentals data for Tesla (TSLA)" }],
			tools: [
				{
					type: "function",
					function: {
						name: "get_stock_fundamentals",
						description: "Get fundamental data for a given stock symbol using yfinance API.",
						parameters: {
							type: "object",
							properties: { symbol: { type: "string", description: "The stock symbol." } },
							required: ["symbol"],
						},
						return: {
							type: "object",
							description:
								"A dictionary containing fundamental data.\n\nKeys:\n    - 'symbol': The stock symbol.\n    - 'company_name': The long name of the company.\n    - 'sector': The sector to which the company belongs.\n    - 'industry': The industry to which the company belongs.\n    - 'market_cap': The market capitalization of the company.\n    - 'pe_ratio': The forward price-to-earnings ratio.\n    - 'pb_ratio': The price-to-book ratio.\n    - 'dividend_yield': The dividend yield.\n    - 'eps': The trailing earnings per share.\n    - 'beta': The beta value of the stock.\n    - '52_week_high': The 52-week high price of the stock.\n    - '52_week_low': The 52-week low price of the stock.",
						},
					},
				},
			],
			bos_token: "<|begin_of_text|>",
			eos_token: "<|im_end|>",
			add_generation_prompt: true,
		},
		target: `<|begin_of_text|>You are a function calling AI model. You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Here are the available tools: <tools> {"type": "function", "function": {"name": get_stock_fundamentals", "description": "get_stock_fundamentals(symbol: str) -> dict - Get fundamental data for a given stock symbol using yfinance API.\n\n    Args:\n        symbol(str): The stock symbol.\n    Returns:\n        A dictionary containing fundamental data.\n\nKeys:\n    - 'symbol': The stock symbol.\n    - 'company_name': The long name of the company.\n    - 'sector': The sector to which the company belongs.\n    - 'industry': The industry to which the company belongs.\n    - 'market_cap': The market capitalization of the company.\n    - 'pe_ratio': The forward price-to-earnings ratio.\n    - 'pb_ratio': The price-to-book ratio.\n    - 'dividend_yield': The dividend yield.\n    - 'eps': The trailing earnings per share.\n    - 'beta': The beta value of the stock.\n    - '52_week_high': The 52-week high price of the stock.\n    - '52_week_low': The 52-week low price of the stock.", "parameters": {"type": "object", "properties": {"symbol": {"type": "string", "description": "The stock symbol."}}, "required": ["symbol"]}} </tools>Use the following pydantic model json schema for each tool call you will make: {"properties": {"arguments": {"title": "Arguments", "type": "object"}, "name": {"title": "Name", "type": "string"}}, "required": ["arguments", "name"], "title": "FunctionCall", "type": "object"}\nFor each function call return a json object with function name and arguments within <tool_call></tool_call> XML tags as follows:\n<tool_call>\n{"arguments": <args-dict>, "name": <function-name>}\n</tool_call><|im_end|><|im_start|>user\nFetch the stock fundamentals data for Tesla (TSLA)<|im_end|>\n<|im_start|>assistant\n`,
	},
	"mistralai/Mistral-Nemo-Instruct-2407": {
		chat_template: `{%- if messages[0]["role"] == "system" %}\n    {%- set system_message = messages[0]["content"] %}\n    {%- set loop_messages = messages[1:] %}\n{%- else %}\n    {%- set loop_messages = messages %}\n{%- endif %}\n{%- if not tools is defined %}\n    {%- set tools = none %}\n{%- endif %}\n{%- set user_messages = loop_messages | selectattr("role", "equalto", "user") | list %}\n\n{%- for message in loop_messages | rejectattr("role", "equalto", "tool") | rejectattr("role", "equalto", "tool_results") | selectattr("tool_calls", "undefined") %}\n    {%- if (message["role"] == "user") != (loop.index0 % 2 == 0) %}\n        {{- raise_exception("After the optional system message, conversation roles must alternate user/assistant/user/assistant/...") }}\n    {%- endif %}\n{%- endfor %}\n\n{{- bos_token }}\n{%- for message in loop_messages %}\n    {%- if message["role"] == "user" %}\n        {%- if tools is not none and (message == user_messages[-1]) %}\n            {{- "[AVAILABLE_TOOLS][" }}\n            {%- for tool in tools %}\n        {%- set tool = tool.function %}\n        {{- '{"type": "function", "function": {' }}\n        {%- for key, val in tool.items() if key != "return" %}\n            {%- if val is string %}\n            {{- '"' + key + '": "' + val + '"' }}\n            {%- else %}\n            {{- '"' + key + '": ' + val|tojson }}\n            {%- endif %}\n            {%- if not loop.last %}\n            {{- ", " }}\n            {%- endif %}\n        {%- endfor %}\n        {{- "}}" }}\n                {%- if not loop.last %}\n                    {{- ", " }}\n                {%- else %}\n                    {{- "]" }}\n                {%- endif %}\n            {%- endfor %}\n            {{- "[/AVAILABLE_TOOLS]" }}\n            {%- endif %}\n        {%- if loop.last and system_message is defined %}\n            {{- "[INST]" + system_message + "\\n\\n" + message["content"] + "[/INST]" }}\n        {%- else %}\n            {{- "[INST]" + message["content"] + "[/INST]" }}\n        {%- endif %}\n    {%- elif message["role"] == "tool_calls" or message.tool_calls is defined %}\n        {%- if message.tool_calls is defined %}\n            {%- set tool_calls = message.tool_calls %}\n        {%- else %}\n            {%- set tool_calls = message.content %}\n        {%- endif %}\n        {{- "[TOOL_CALLS][" }}\n        {%- for tool_call in tool_calls %}\n            {%- set out = tool_call.function|tojson %}\n            {{- out[:-1] }}\n            {%- if not tool_call.id is defined or tool_call.id|length != 9 %}\n                {{- raise_exception("Tool call IDs should be alphanumeric strings with length 9!") }}\n            {%- endif %}\n            {{- ', "id": "' + tool_call.id + '"}' }}\n            {%- if not loop.last %}\n                {{- ", " }}\n            {%- else %}\n                {{- "]" + eos_token }}\n            {%- endif %}\n        {%- endfor %}\n    {%- elif message["role"] == "assistant" %}\n        {{- message["content"] + eos_token}}\n    {%- elif message["role"] == "tool_results" or message["role"] == "tool" %}\n        {%- if message.content is defined and message.content.content is defined %}\n            {%- set content = message.content.content %}\n        {%- else %}\n            {%- set content = message.content %}\n        {%- endif %}\n        {{- '[TOOL_RESULTS]{"content": ' + content|string + ", " }}\n        {%- if not message.tool_call_id is defined or message.tool_call_id|length != 9 %}\n            {{- raise_exception("Tool call IDs should be alphanumeric strings with length 9!") }}\n        {%- endif %}\n        {{- '"call_id": "' + message.tool_call_id + '"}[/TOOL_RESULTS]' }}\n    {%- else %}\n        {{- raise_exception("Only user and assistant roles are supported, with the exception of an initial optional system message!") }}\n    {%- endif %}\n{%- endfor %}\n`,
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		target: `<s>[INST]Hello, how are you?[/INST]I'm doing great. How can I help you today?</s>[INST]I'd like to show off how chat templating works![/INST]`,
	},
	"meta-llama/Llama-3.1-8B-Instruct": {
		chat_template: `{{- bos_token }}\n{%- if custom_tools is defined %}\n    {%- set tools = custom_tools %}\n{%- endif %}\n{%- if not tools_in_user_message is defined %}\n    {%- set tools_in_user_message = true %}\n{%- endif %}\n{%- if not date_string is defined %}\n    {%- set date_string = "26 Jul 2024" %}\n{%- endif %}\n{%- if not tools is defined %}\n    {%- set tools = none %}\n{%- endif %}\n\n{#- This block extracts the system message, so we can slot it into the right place. #}\n{%- if messages[0]['role'] == 'system' %}\n    {%- set system_message = messages[0]['content']|trim %}\n    {%- set messages = messages[1:] %}\n{%- else %}\n    {%- set system_message = "" %}\n{%- endif %}\n\n{#- System message + builtin tools #}\n{{- "<|start_header_id|>system<|end_header_id|>\\n\\n" }}\n{%- if builtin_tools is defined or tools is not none %}\n    {{- "Environment: ipython\\n" }}\n{%- endif %}\n{%- if builtin_tools is defined %}\n    {{- "Tools: " + builtin_tools | reject('equalto', 'code_interpreter') | join(", ") + "\\n\\n"}}\n{%- endif %}\n{{- "Cutting Knowledge Date: December 2023\\n" }}\n{{- "Today Date: " + date_string + "\\n\\n" }}\n{%- if tools is not none and not tools_in_user_message %}\n    {{- "You have access to the following functions. To call a function, please respond with JSON for a function call." }}\n    {{- 'Respond in the format {"name": function name, "parameters": dictionary of argument name and its value}.' }}\n    {{- "Do not use variables.\\n\\n" }}\n    {%- for t in tools %}\n        {{- t | tojson(indent=4) }}\n        {{- "\\n\\n" }}\n    {%- endfor %}\n{%- endif %}\n{{- system_message }}\n{{- "<|eot_id|>" }}\n\n{#- Custom tools are passed in a user message with some extra guidance #}\n{%- if tools_in_user_message and not tools is none %}\n    {#- Extract the first user message so we can plug it in here #}\n    {%- if messages | length != 0 %}\n        {%- set first_user_message = messages[0]['content']|trim %}\n        {%- set messages = messages[1:] %}\n    {%- else %}\n        {{- raise_exception("Cannot put tools in the first user message when there's no first user message!") }}\n{%- endif %}\n    {{- '<|start_header_id|>user<|end_header_id|>\\n\\n' -}}\n    {{- "Given the following functions, please respond with a JSON for a function call " }}\n    {{- "with its proper arguments that best answers the given prompt.\\n\\n" }}\n    {{- 'Respond in the format {"name": function name, "parameters": dictionary of argument name and its value}.' }}\n    {{- "Do not use variables.\\n\\n" }}\n    {%- for t in tools %}\n        {{- t | tojson(indent=4) }}\n        {{- "\\n\\n" }}\n    {%- endfor %}\n    {{- first_user_message + "<|eot_id|>"}}\n{%- endif %}\n\n{%- for message in messages %}\n    {%- if not (message.role == 'ipython' or message.role == 'tool' or 'tool_calls' in message) %}\n        {{- '<|start_header_id|>' + message['role'] + '<|end_header_id|>\\n\\n'+ message['content'] | trim + '<|eot_id|>' }}\n    {%- elif 'tool_calls' in message %}\n        {%- if not message.tool_calls|length == 1 %}\n            {{- raise_exception("This model only supports single tool-calls at once!") }}\n        {%- endif %}\n        {%- set tool_call = message.tool_calls[0].function %}\n        {%- if builtin_tools is defined and tool_call.name in builtin_tools %}\n            {{- '<|start_header_id|>assistant<|end_header_id|>\\n\\n' -}}\n            {{- "<|python_tag|>" + tool_call.name + ".call(" }}\n            {%- for arg_name, arg_val in tool_call.arguments | items %}\n                {{- arg_name + '="' + arg_val + '"' }}\n                {%- if not loop.last %}\n                    {{- ", " }}\n                {%- endif %}\n                {%- endfor %}\n            {{- ")" }}\n        {%- else  %}\n            {{- '<|start_header_id|>assistant<|end_header_id|>\\n\\n' -}}\n            {{- '{"name": "' + tool_call.name + '", ' }}\n            {{- '"parameters": ' }}\n            {{- tool_call.arguments | tojson }}\n            {{- "}" }}\n        {%- endif %}\n        {%- if builtin_tools is defined %}\n            {#- This means we're in ipython mode #}\n            {{- "<|eom_id|>" }}\n        {%- else %}\n            {{- "<|eot_id|>" }}\n        {%- endif %}\n    {%- elif message.role == "tool" or message.role == "ipython" %}\n        {{- "<|start_header_id|>ipython<|end_header_id|>\\n\\n" }}\n        {%- if message.content is mapping or message.content is iterable %}\n            {{- message.content | tojson }}\n        {%- else %}\n            {{- message.content }}\n        {%- endif %}\n        {{- "<|eot_id|>" }}\n    {%- endif %}\n{%- endfor %}\n{%- if add_generation_prompt %}\n    {{- '<|start_header_id|>assistant<|end_header_id|>\\n\\n' }}\n{%- endif %}\n`,
		data: {
			messages: [
				{ role: "system", content: "You are a bot that responds to weather queries." },
				{ role: "user", content: "Hey, what's the temperature in Paris right now?" },
			],
			tools: [EXAMPLE_TOOL_JSON_SCHEMAS.get_current_temperature_v1],
			bos_token: "<|begin_of_text|>",
			eos_token: "<|im_end|>",
			add_generation_prompt: true,
		},
		target: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\nEnvironment: ipython\nCutting Knowledge Date: December 2023\nToday Date: 26 Jul 2024\n\nYou are a bot that responds to weather queries.<|eot_id|><|start_header_id|>user<|end_header_id|>\n\nGiven the following functions, please respond with a JSON for a function call with its proper arguments that best answers the given prompt.\n\nRespond in the format {"name": function name, "parameters": dictionary of argument name and its value}.Do not use variables.\n\n{\n    "type": "function",\n    "function": {\n        "name": "get_current_temperature",\n        "description": "Get the current temperature at a location.",\n        "parameters": {\n            "type": "object",\n            "properties": {\n                "location": {\n                    "type": "string",\n                    "description": "The location to get the temperature for, in the format \\"City, Country\\""\n                }\n            },\n            "required": [\n                "location"\n            ]\n        },\n        "return": {\n            "type": "number",\n            "description": "The current temperature at the specified location in the specified units, as a float."\n        }\n    }\n}\n\nHey, what's the temperature in Paris right now?<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
	},
	"deepseek-ai/DeepSeek-R1": {
		chat_template: `{% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}{% set ns = namespace(is_first=false, is_tool=false, is_output_first=true, system_prompt='', is_first_sp=true) %}{%- for message in messages %}{%- if message['role'] == 'system' %}{%- if ns.is_first_sp %}{% set ns.system_prompt = ns.system_prompt + message['content'] %}{% set ns.is_first_sp = false %}{%- else %}{% set ns.system_prompt = ns.system_prompt + '\\n\\n' + message['content'] %}{%- endif %}{%- endif %}{%- endfor %}{{ bos_token }}{{ ns.system_prompt }}{%- for message in messages %}{%- if message['role'] == 'user' %}{%- set ns.is_tool = false -%}{{'<｜User｜>' + message['content']}}{%- endif %}{%- if message['role'] == 'assistant' and 'tool_calls' in message %}{%- set ns.is_tool = false -%}{%- for tool in message['tool_calls'] %}{%- if not ns.is_first %}{%- if message['content'] is none %}{{'<｜Assistant｜><｜tool▁calls▁begin｜><｜tool▁call▁begin｜>' + tool['type'] + '<｜tool▁sep｜>' + tool['function']['name'] + '\\n' + '\`\`\`json' + '\\n' + tool['function']['arguments'] + '\\n' + '\`\`\`' + '<｜tool▁call▁end｜>'}}{%- else %}{{'<｜Assistant｜>' + message['content'] + '<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>' + tool['type'] + '<｜tool▁sep｜>' + tool['function']['name'] + '\\n' + '\`\`\`json' + '\\n' + tool['function']['arguments'] + '\\n' + '\`\`\`' + '<｜tool▁call▁end｜>'}}{%- endif %}{%- set ns.is_first = true -%}{%- else %}{{'\\n' + '<｜tool▁call▁begin｜>' + tool['type'] + '<｜tool▁sep｜>' + tool['function']['name'] + '\\n' + '\`\`\`json' + '\\n' + tool['function']['arguments'] + '\\n' + '\`\`\`' + '<｜tool▁call▁end｜>'}}{%- endif %}{%- endfor %}{{'<｜tool▁calls▁end｜><｜end▁of▁sentence｜>'}}{%- endif %}{%- if message['role'] == 'assistant' and 'tool_calls' not in message %}{%- if ns.is_tool %}{{'<｜tool▁outputs▁end｜>' + message['content'] + '<｜end▁of▁sentence｜>'}}{%- set ns.is_tool = false -%}{%- else %}{% set content = message['content'] %}{% if '</think>' in content %}{% set content = content.split('</think>')[-1] %}{% endif %}{{'<｜Assistant｜>' + content + '<｜end▁of▁sentence｜>'}}{%- endif %}{%- endif %}{%- if message['role'] == 'tool' %}{%- set ns.is_tool = true -%}{%- if ns.is_output_first %}{{'<｜tool▁outputs▁begin｜><｜tool▁output▁begin｜>' + message['content'] + '<｜tool▁output▁end｜>'}}{%- set ns.is_output_first = false %}{%- else %}{{'<｜tool▁output▁begin｜>' + message['content'] + '<｜tool▁output▁end｜>'}}{%- endif %}{%- endif %}{%- endfor -%}{% if ns.is_tool %}{{'<｜tool▁outputs▁end｜>'}}{% endif %}{% if add_generation_prompt and not ns.is_tool %}{{'<｜Assistant｜>'}}{% endif %}`,
		data: {
			messages: [
				{ role: "user", content: "Hi there." },
				{ role: "assistant", content: '<think>The user said "Hi there."</think>Hi!' },
				{ role: "user", content: "Tell me a joke." },
			],
			bos_token: "<｜begin▁of▁sentence｜>",
			eos_token: "<｜end▁of▁sentence｜>",
			add_generation_prompt: true,
		},
		target: `<｜begin▁of▁sentence｜><｜User｜>Hi there.<｜Assistant｜>Hi!<｜end▁of▁sentence｜><｜User｜>Tell me a joke.<｜Assistant｜>`,
	},
	"MadeAgents/Hammer2.1": {
		chat_template: `{%- set system_message = 'You are a helpful assistant.' %}\n{%- if messages[0]['role'] == 'system' %}\n    {%- set system_message = messages[0]['content'] %}\n    {%- if messages[1]['role'] == 'system' %}\n        {%- set format_message = messages[1]['content'] %}\n        {%- set loop_messages = messages[2:] %}\n    {%- else %}\n        {%- set loop_messages = messages[1:] %}\n    {%- endif %}\n{%- else %}\n    {%- set loop_messages = messages %}\n{%- endif %}\n{%- if not tools is defined %}\n    {%- set tools = none %}\n{%- endif %}\n{%- if system_message is defined %}\n{{- '<|im_start|>system\n' + system_message + '<|im_end|>\n' }}\n{%- endif %}\n\n\n{%- if tools is not none %}\n{% set task_instruction %}You are a tool calling assistant. In order to complete the user's request, you need to select one or more appropriate tools from the following tools and fill in the correct values for the tool parameters. Your specific tasks are:\n1. Make one or more function/tool calls to meet the request based on the question.\n2. If none of the function can be used, point it out and refuse to answer.\n3. If the given question lacks the parameters required by the function, also point it out.\n\nThe following are characters that may interact with you\n1. user: Provides query or additional information.\n2. tool: Returns the results of the tool calling.\n{% endset %}\n\n{% set format_instruction %}\nThe output MUST strictly adhere to the following JSON format, and NO other text MUST be included.\nThe example format is as follows. Please make sure the parameter type is correct. If no function call is needed, please directly output an empty list '[]'\n\`\`\`\n[\n    {\"name\": \"func_name1\", \"arguments\": {\"argument1\": \"value1\", \"argument2\": \"value2\"}},\n    ... (more tool calls as required)\n]\n\`\`\`\n{% endset %}\n{{- '<|im_start|>user\n[BEGIN OF TASK INSTRUCTION]\n' + task_instruction + '\n[END OF TASK INSTRUCTION]\n\n'}}\n    {{- '[BEGIN OF AVAILABLE_TOOLS]\n' }}\n    {{- tools|string }}\n    {{- '\n[END OF AVAILABLE_TOOLS]\n\n' }}\n    {{- '\n[BEGIN OF TASK INSTRUCTION]\n' + format_instruction + '\n[END OF TASK INSTRUCTION]\n\n<|im_end|>\n' }}\n{%- endif %}\n\n{%- for message in loop_messages %}\n    {%- set role = message['role'] %}\n    {%- set content = message['content'] %}\n    {{- '<|im_start|>'+ role +'\n' +  content + '<|im_end|>\n'}}\n{%- endfor %}\n{{- '<|im_start|>assistant\n' }}`,
		data: {
			messages: [{ role: "user", content: "What is current speed of wind?" }],
			tools: EXAMPLE_LIST_OF_TOOLS,
			bos_token: null,
			eos_token: "<im_end>",
		},
		target: `<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n\n<|im_start|>user\n[BEGIN OF TASK INSTRUCTION]\nYou are a tool calling assistant. In order to complete the user\'s request, you need to select one or more appropriate tools from the following tools and fill in the correct values for the tool parameters. Your specific tasks are:\n1. Make one or more function/tool calls to meet the request based on the question.\n2. If none of the function can be used, point it out and refuse to answer.\n3. If the given question lacks the parameters required by the function, also point it out.\n\nThe following are characters that may interact with you\n1. user: Provides query or additional information.\n2. tool: Returns the results of the tool calling.\n\n[END OF TASK INSTRUCTION]\n\n[BEGIN OF AVAILABLE_TOOLS]\n[{\"type\": \"function\", \"function\": {\"name\": \"get_current_temperature\", \"description\": \"Get the current temperature at a location.\", \"parameters\": {\"type\": \"object\", \"properties\": {\"location\": {\"type\": \"string\", \"description\": \"The location to get the temperature for, in the format \\"City, Country\\"\"}, \"unit\": {\"type\": \"string\", \"enum\": [\"celsius\", \"fahrenheit\"], \"description\": \"The unit to return the temperature in.\"}}, \"required\": [\"location\", \"unit\"]}, \"return\": {\"type\": \"number\", \"description\": \"The current temperature at the specified location in the specified units, as a float.\"}}}, {\"type\": \"function\", \"function\": {\"name\": \"get_current_wind_speed\", \"description\": \"Get the current wind speed in km/h at a given location.\", \"parameters\": {\"type\": \"object\", \"properties\": {\"location\": {\"type\": \"string\", \"description\": \"The location to get the temperature for, in the format \\"City, Country\\"\"}}, \"required\": [\"location\"]}, \"return\": {\"type\": \"number\", \"description\": \"The current wind speed at the given location in km/h, as a float.\"}}}]\n[END OF AVAILABLE_TOOLS]\n\n\n[BEGIN OF TASK INSTRUCTION]\nThe output MUST strictly adhere to the following JSON format, and NO other text MUST be included.\nThe example format is as follows. Please make sure the parameter type is correct. If no function call is needed, please directly output an empty list \'[]\'\n\`\`\`\n[\n    {"name": "func_name1", "arguments": {"argument1": "value1", "argument2": "value2"}},\n    ... (more tool calls as required)\n]\n\`\`\`\n\n[END OF TASK INSTRUCTION]\n\n<|im_end|>\n<|im_start|>user\nWhat is current speed of wind?<|im_end|>\n<|im_start|>assistant\n`,
	},
});

describe("End-to-end tests", () => {
	describe("Default templates", async () => {
		for (const [model_type, test_data] of Object.entries(TEST_DEFAULT_TEMPLATES)) {
			it(model_type, async () => {
				const template = new Template(test_data.chat_template);
				const result = template.render(test_data.data);
				expect(result).toEqual(test_data.target);
			});
		}
	});

	describe("Custom templates", async () => {
		for (const [model_type, test_data] of Object.entries(TEST_CUSTOM_TEMPLATES)) {
			it(model_type, async () => {
				const template = new Template(test_data.chat_template);
				const result = template.render(test_data.data);
				expect(result).toEqual(test_data.target);
			});
		}
	});

	it("should parse a chat template from the Hugging Face Hub", async () => {
		const repo = "TheBloke/Mistral-7B-Instruct-v0.1-GPTQ";
		const tokenizerConfig = await (
			await downloadFile({
				repo,
				path: "tokenizer_config.json",
			})
		).json();

		const template = new Template(tokenizerConfig.chat_template);
		const result = template.render(TEST_CUSTOM_TEMPLATES[repo].data);
		expect(result).toEqual(TEST_CUSTOM_TEMPLATES[repo].target);
	});
});
