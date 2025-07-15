import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

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
	"Qwen/Qwen2.5-7B-Instruct": {
		chat_template:
			"{%- if tools %}\n    {{- '<|im_start|>system\\n' }}\n    {%- if messages[0]['role'] == 'system' %}\n        {{- messages[0]['content'] }}\n    {%- else %}\n        {{- 'You are Qwen, created by Alibaba Cloud. You are a helpful assistant.' }}\n    {%- endif %}\n    {{- \"\\n\\n# Tools\\n\\nYou may call one or more functions to assist with the user query.\\n\\nYou are provided with function signatures within <tools></tools> XML tags:\\n<tools>\" }}\n    {%- for tool in tools %}\n        {{- \"\\n\" }}\n        {{- tool | tojson }}\n    {%- endfor %}\n    {{- \"\\n</tools>\\n\\nFor each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:\\n<tool_call>\\n{\\\"name\\\": <function-name>, \\\"arguments\\\": <args-json-object>}\\n</tool_call><|im_end|>\\n\" }}\n{%- else %}\n    {%- if messages[0]['role'] == 'system' %}\n        {{- '<|im_start|>system\\n' + messages[0]['content'] + '<|im_end|>\\n' }}\n    {%- else %}\n        {{- '<|im_start|>system\\nYou are Qwen, created by Alibaba Cloud. You are a helpful assistant.<|im_end|>\\n' }}\n    {%- endif %}\n{%- endif %}\n{%- for message in messages %}\n    {%- if (message.role == \"user\") or (message.role == \"system\" and not loop.first) or (message.role == \"assistant\" and not message.tool_calls) %}\n        {{- '<|im_start|>' + message.role + '\\n' + message.content + '<|im_end|>' + '\\n' }}\n    {%- elif message.role == \"assistant\" %}\n        {{- '<|im_start|>' + message.role }}\n        {%- if message.content %}\n            {{- '\\n' + message.content }}\n        {%- endif %}\n        {%- for tool_call in message.tool_calls %}\n            {%- if tool_call.function is defined %}\n                {%- set tool_call = tool_call.function %}\n            {%- endif %}\n            {{- '\\n<tool_call>\\n{\"name\": \"' }}\n            {{- tool_call.name }}\n            {{- '\", \"arguments\": ' }}\n            {{- tool_call.arguments | tojson }}\n            {{- '}\\n</tool_call>' }}\n        {%- endfor %}\n        {{- '<|im_end|>\\n' }}\n    {%- elif message.role == \"tool\" %}\n        {%- if (loop.index0 == 0) or (messages[loop.index0 - 1].role != \"tool\") %}\n            {{- '<|im_start|>user' }}\n        {%- endif %}\n        {{- '\\n<tool_response>\\n' }}\n        {{- message.content }}\n        {{- '\\n</tool_response>' }}\n        {%- if loop.last or (messages[loop.index0 + 1].role != \"tool\") %}\n            {{- '<|im_end|>\\n' }}\n        {%- endif %}\n    {%- endif %}\n{%- endfor %}\n{%- if add_generation_prompt %}\n    {{- '<|im_start|>assistant\\n' }}\n{%- endif %}\n",
		data: {
			// Example adapted from https://qwen.readthedocs.io/en/latest/framework/function_call.html
			messages: [
				{
					role: "system",
					content: "You are Qwen, created by Alibaba Cloud. You are a helpful assistant.\n\nCurrent Date: 2024-09-30",
				},
				{ role: "user", content: "What's the temperature in San Francisco now? How about tomorrow?" },
				{
					role: "assistant",
					content: "",
					tool_calls: [
						{
							type: "function",
							function: { name: "get_current_temperature", arguments: { location: "San Francisco, CA, USA" } },
						},
						{
							type: "function",
							function: {
								name: "get_temperature_date",
								arguments: { location: "San Francisco, CA, USA", date: "2024-10-01" },
							},
						},
					],
				},
				{
					role: "tool",
					name: "get_current_temperature",
					content: '{"temperature": 26.1, "location": "San Francisco, CA, USA", "unit": "celsius"}',
				},
				{
					role: "tool",
					name: "get_temperature_date",
					content:
						'{"temperature": 25.9, "location": "San Francisco, CA, USA", "date": "2024-10-01", "unit": "celsius"}',
				},
			],
			tools: [
				{
					type: "function",
					function: {
						name: "get_current_temperature",
						description: "Get current temperature at a location.",
						parameters: {
							type: "object",
							properties: {
								location: {
									type: "string",
									description: 'The location to get the temperature for, in the format "City, State, Country".',
								},
								unit: {
									type: "string",
									enum: ["celsius", "fahrenheit"],
									description: 'The unit to return the temperature in. Defaults to "celsius".',
								},
							},
							required: ["location"],
						},
					},
				},
				{
					type: "function",
					function: {
						name: "get_temperature_date",
						description: "Get temperature at a location and date.",
						parameters: {
							type: "object",
							properties: {
								location: {
									type: "string",
									description: 'The location to get the temperature for, in the format "City, State, Country".',
								},
								date: {
									type: "string",
									description: 'The date to get the temperature for, in the format "Year-Month-Day".',
								},
								unit: {
									type: "string",
									enum: ["celsius", "fahrenheit"],
									description: 'The unit to return the temperature in. Defaults to "celsius".',
								},
							},
							required: ["location", "date"],
						},
					},
				},
			],
		},
		target:
			'<|im_start|>system\nYou are Qwen, created by Alibaba Cloud. You are a helpful assistant.\n\nCurrent Date: 2024-09-30\n\n# Tools\n\nYou may call one or more functions to assist with the user query.\n\nYou are provided with function signatures within <tools></tools> XML tags:\n<tools>\n{"type": "function", "function": {"name": "get_current_temperature", "description": "Get current temperature at a location.", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "The location to get the temperature for, in the format \\"City, State, Country\\"."}, "unit": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "The unit to return the temperature in. Defaults to \\"celsius\\"."}}, "required": ["location"]}}}\n{"type": "function", "function": {"name": "get_temperature_date", "description": "Get temperature at a location and date.", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "The location to get the temperature for, in the format \\"City, State, Country\\"."}, "date": {"type": "string", "description": "The date to get the temperature for, in the format \\"Year-Month-Day\\"."}, "unit": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "The unit to return the temperature in. Defaults to \\"celsius\\"."}}, "required": ["location", "date"]}}}\n</tools>\n\nFor each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:\n<tool_call>\n{"name": <function-name>, "arguments": <args-json-object>}\n</tool_call><|im_end|>\n<|im_start|>user\nWhat\'s the temperature in San Francisco now? How about tomorrow?<|im_end|>\n<|im_start|>assistant\n<tool_call>\n{"name": "get_current_temperature", "arguments": {"location": "San Francisco, CA, USA"}}\n</tool_call>\n<tool_call>\n{"name": "get_temperature_date", "arguments": {"location": "San Francisco, CA, USA", "date": "2024-10-01"}}\n</tool_call><|im_end|>\n<|im_start|>user\n<tool_response>\n{"temperature": 26.1, "location": "San Francisco, CA, USA", "unit": "celsius"}\n</tool_response>\n<tool_response>\n{"temperature": 25.9, "location": "San Francisco, CA, USA", "date": "2024-10-01", "unit": "celsius"}\n</tool_response><|im_end|>\n',
	},
	"Qwen/Qwen2.5-VL-7B-Instruct": {
		chat_template:
			"{% set image_count = namespace(value=0) %}{% set video_count = namespace(value=0) %}{% for message in messages %}{% if loop.first and message['role'] != 'system' %}<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n{% endif %}<|im_start|>{{ message['role'] }}\n{% if message['content'] is string %}{{ message['content'] }}<|im_end|>\n{% else %}{% for content in message['content'] %}{% if content['type'] == 'image' or 'image' in content or 'image_url' in content %}{% set image_count.value = image_count.value + 1 %}{% if add_vision_id %}Picture {{ image_count.value }}: {% endif %}<|vision_start|><|image_pad|><|vision_end|>{% elif content['type'] == 'video' or 'video' in content %}{% set video_count.value = video_count.value + 1 %}{% if add_vision_id %}Video {{ video_count.value }}: {% endif %}<|vision_start|><|video_pad|><|vision_end|>{% elif 'text' in content %}{{ content['text'] }}{% endif %}{% endfor %}<|im_end|>\n{% endif %}{% endfor %}{% if add_generation_prompt %}<|im_start|>assistant\n{% endif %}",
		data: {
			// Example adapted from https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct
			messages: [
				{
					role: "user",
					content: [
						{
							type: "image",
							image: "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen-VL/assets/demo.jpeg",
						},
						{ type: "text", text: "Describe this image." },
					],
				},
			],
			add_generation_prompt: true,
		},
		target:
			"<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n<|im_start|>user\n<|vision_start|><|image_pad|><|vision_end|>Describe this image.<|im_end|>\n<|im_start|>assistant\n",
	},
	"Qwen/Qwen3-0.6B": {
		chat_template:
			"{%- if tools %}\n    {{- '<|im_start|>system\\n' }}\n    {%- if messages[0].role == 'system' %}\n        {{- messages[0].content + '\\n\\n' }}\n    {%- endif %}\n    {{- \"# Tools\\n\\nYou may call one or more functions to assist with the user query.\\n\\nYou are provided with function signatures within <tools></tools> XML tags:\\n<tools>\" }}\n    {%- for tool in tools %}\n        {{- \"\\n\" }}\n        {{- tool | tojson }}\n    {%- endfor %}\n    {{- \"\\n</tools>\\n\\nFor each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:\\n<tool_call>\\n{\\\"name\\\": <function-name>, \\\"arguments\\\": <args-json-object>}\\n</tool_call><|im_end|>\\n\" }}\n{%- else %}\n    {%- if messages[0].role == 'system' %}\n        {{- '<|im_start|>system\\n' + messages[0].content + '<|im_end|>\\n' }}\n    {%- endif %}\n{%- endif %}\n{%- set ns = namespace(multi_step_tool=true, last_query_index=messages|length - 1) %}\n{%- for message in messages[::-1] %}\n    {%- set index = (messages|length - 1) - loop.index0 %}\n    {%- if ns.multi_step_tool and message.role == \"user\" and not(message.content.startswith('<tool_response>') and message.content.endswith('</tool_response>')) %}\n        {%- set ns.multi_step_tool = false %}\n        {%- set ns.last_query_index = index %}\n    {%- endif %}\n{%- endfor %}\n{%- for message in messages %}\n    {%- if (message.role == \"user\") or (message.role == \"system\" and not loop.first) %}\n        {{- '<|im_start|>' + message.role + '\\n' + message.content + '<|im_end|>' + '\\n' }}\n    {%- elif message.role == \"assistant\" %}\n        {%- set content = message.content %}\n        {%- set reasoning_content = '' %}\n        {%- if message.reasoning_content is defined and message.reasoning_content is not none %}\n            {%- set reasoning_content = message.reasoning_content %}\n        {%- else %}\n            {%- if '</think>' in message.content %}\n                {%- set content = message.content.split('</think>')[-1].lstrip('\\n') %}\n                {%- set reasoning_content = message.content.split('</think>')[0].rstrip('\\n').split('<think>')[-1].lstrip('\\n') %}\n            {%- endif %}\n        {%- endif %}\n        {%- if loop.index0 > ns.last_query_index %}\n            {%- if loop.last or (not loop.last and reasoning_content) %}\n                {{- '<|im_start|>' + message.role + '\\n<think>\\n' + reasoning_content.strip('\\n') + '\\n</think>\\n\\n' + content.lstrip('\\n') }}\n            {%- else %}\n                {{- '<|im_start|>' + message.role + '\\n' + content }}\n            {%- endif %}\n        {%- else %}\n            {{- '<|im_start|>' + message.role + '\\n' + content }}\n        {%- endif %}\n        {%- if message.tool_calls %}\n            {%- for tool_call in message.tool_calls %}\n                {%- if (loop.first and content) or (not loop.first) %}\n                    {{- '\\n' }}\n                {%- endif %}\n                {%- if tool_call.function %}\n                    {%- set tool_call = tool_call.function %}\n                {%- endif %}\n                {{- '<tool_call>\\n{\"name\": \"' }}\n                {{- tool_call.name }}\n                {{- '\", \"arguments\": ' }}\n                {%- if tool_call.arguments is string %}\n                    {{- tool_call.arguments }}\n                {%- else %}\n                    {{- tool_call.arguments | tojson }}\n                {%- endif %}\n                {{- '}\\n</tool_call>' }}\n            {%- endfor %}\n        {%- endif %}\n        {{- '<|im_end|>\\n' }}\n    {%- elif message.role == \"tool\" %}\n        {%- if loop.first or (messages[loop.index0 - 1].role != \"tool\") %}\n            {{- '<|im_start|>user' }}\n        {%- endif %}\n        {{- '\\n<tool_response>\\n' }}\n        {{- message.content }}\n        {{- '\\n</tool_response>' }}\n        {%- if loop.last or (messages[loop.index0 + 1].role != \"tool\") %}\n            {{- '<|im_end|>\\n' }}\n        {%- endif %}\n    {%- endif %}\n{%- endfor %}\n{%- if add_generation_prompt %}\n    {{- '<|im_start|>assistant\\n' }}\n    {%- if enable_thinking is defined and enable_thinking is false %}\n        {{- '<think>\\n\\n</think>\\n\\n' }}\n    {%- endif %}\n{%- endif %}",
		data: {
			// Example adapted from https://huggingface.co/Qwen/Qwen3-0.6B#quickstart
			messages: [{ role: "user", content: "Give me a short introduction to large language model." }],
			add_generation_prompt: true,
			enable_thinking: true,
		},
		target:
			"<|im_start|>user\nGive me a short introduction to large language model.<|im_end|>\n<|im_start|>assistant\n",
	},

	"CohereLabs/c4ai-command-a-03-2025": {
		// Example adapted from https://huggingface.co/CohereLabs/c4ai-command-a-03-2025#rag-capabilities
		chat_template:
			'{{ bos_token }}{% set tools = [] %}\n{%- macro document_turn(documents) -%}\n{# format documents into chat turn #}\n<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|><|START_THINKING|>I will look through the document to address the users needs.<|END_THINKING|><|START_ACTION|>[\n    {"tool_call_id": "0", "tool_name": "direct-injected-document", "parameters": {}}\n]<|END_ACTION|><|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|><|START_TOOL_RESULT|>[\n    {\n        "tool_call_id": "0",\n        "results": {\n{% for doc in documents %}\n            "{{ loop.index0 }}": {{doc|tojson}}{% if not loop.last %},\n            {% endif %}\n{% endfor %}\n\n        },\n        "is_error": null\n    }\n]<|END_TOOL_RESULT|><|END_OF_TURN_TOKEN|>{%- endmacro %}\n{%- macro tool_call_id_to_int(messages, tool_call_id) %}\n{%- set counter = namespace(value=0) %}\n{%- set tool_call_id_seen = namespace(value=false) %}\n{%- for msg in messages %}\n    {%- if msg.tool_calls %}\n        {%- for tool_call in msg.tool_calls %}\n            {%- if tool_call.id == tool_call_id and not tool_call_id_seen.value -%}\n                {{ counter.value }}\n                {%- set tool_call_id_seen.value = true %}\n            {%- endif %}\n            {%- set counter.value = counter.value + 1 %}\n        {%- endfor %}\n    {%- endif %}\n{%- endfor %}\n{%- endmacro %}\n{%- macro format_tool_message(messages, tool_msg) -%}\n{# format tool message #}\n    {\n        "tool_call_id": "{{ tool_call_id_to_int(messages, tool_msg.tool_call_id) }}",\n        "results": {\n            "0": {{ tool_msg.content|tojson }}\n        },\n        "is_error": null\n    }\n{%- endmacro -%}\n{%- if messages and messages[0][\'role\']|lower == \'system\' %}{%- set developer_preamble = messages[0][\'content\'] %}{% endif %}\n{%- set tool_idx = namespace(value=0) %}\n{%- set tool_ids_seen = namespace(value=[]) %}\n{%- set sent_documents = namespace(value=false) %}\n<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|># System Preamble\nYou are in contextual safety mode. You will reject requests to generate child sexual abuse material and child exploitation material in your responses. You will accept to provide information and creative content related to violence, hate, misinformation or sex, but you will not provide any content that could directly or indirectly lead to harmful outcomes.\n\nYour information cutoff date is June 2024.\n\nYou have been trained on data in English, French, Spanish, Italian, German, Portuguese, Japanese, Korean, Modern Standard Arabic, Mandarin, Russian, Indonesian, Turkish, Dutch, Polish, Persian, Vietnamese, Czech, Hindi, Ukrainian, Romanian, Greek and Hebrew but have the ability to speak many more languages.\n{% if tools or documents %}\n\nYou have been trained to have advanced reasoning and tool-use capabilities and you should make best use of these skills to serve user\'s requests.\n\n## Tool Use\nThink about how you can make best use of the provided tools to help with the task and come up with a high level plan that you will execute first.\n\n0. Start by writing <|START_THINKING|> followed by a detailed step by step plan of how you will solve the problem. For each step explain your thinking fully and give details of required tool calls (if needed). Unless specified otherwise, you write your plan in natural language. When you finish, close it out with <|END_THINKING|>.\n    You can optionally choose to skip this step when the user request is so straightforward to address that only a trivial plan would be needed.\n    NOTE: You MUST skip this step when you are directly responding to the user\'s request without using any tools.\n\nThen carry out your plan by repeatedly executing the following steps.\n1. Action: write <|START_ACTION|> followed by a list of JSON-formatted tool calls, with each one containing "tool_name" and "parameters" fields.\n    When there are multiple tool calls which are completely independent of each other (i.e. they can be executed in parallel), you should list them out all together in one step. When you finish, close it out with <|END_ACTION|>.\n2. Observation: you will then receive results of those tool calls in JSON format in the very next turn, wrapped around by <|START_TOOL_RESULT|> and <|END_TOOL_RESULT|>. Carefully observe those results and think about what to do next. Note that these results will be provided to you in a separate turn. NEVER hallucinate results.\n    Every tool call produces a list of results (when a tool call produces no result or a single result, it\'ll still get wrapped inside a list). Each result is clearly linked to its originating tool call via its "tool_call_id".\n3. Reflection: start the next turn by writing <|START_THINKING|> followed by what you\'ve figured out so far, any changes you need to make to your plan, and what you will do next. When you finish, close it out with <|END_THINKING|>.\n    You can optionally choose to skip this step when everything is going according to plan and no special pieces of information or reasoning chains need to be recorded.\n    NOTE: You MUST skip this step when you are done with tool-use actions and are ready to respond to the user.\n\nYou can repeat the above 3 steps multiple times (could be 0 times too if no suitable tool calls are available or needed), until you decide it\'s time to finally respond to the user.\n\n4. Response: then break out of the loop and write <|START_RESPONSE|> followed by a piece of text which serves as a response to the user\'s last request. Use all previous tool calls and results to help you when formulating your response. When you finish, close it out with <|END_RESPONSE|>.\n{% if enable_citations %}\n\n## Grounding\nImportantly, note that "Reflection" and "Response" above can be grounded.\nGrounding means you associate pieces of texts (called "spans") with those specific tool results that support them (called "sources"). And you use a pair of tags "<co>" and "</co>" to indicate when a span can be grounded onto a list of sources, listing them out in the closing tag. Sources from the same tool call are grouped together and listed as "{tool_call_id}:[{list of result indices}]", before they are joined together by ",". E.g., "<co>span</co: 0:[1,2],1:[0]>" means that "span" is supported by result 1 and 2 from "tool_call_id=0" as well as result 0 from "tool_call_id=1".\n{% endif %}\n\n## Available Tools\nHere is the list of tools that you have available to you.\nYou can ONLY use the tools listed here. When a tool is not listed below, it is NOT available and you should NEVER attempt to use it.\nEach tool is represented as a JSON object with fields like "name", "description", "parameters" (per JSON Schema), and optionally, "responses" (per JSON Schema).\n\n```json\n[\n{% if documents %}\n    {"name": "direct-injected-document", "description": "This is a special tool to directly inject user-uploaded documents into the chat as additional context. DO NOT use this tool by yourself!", "parameters": {"type": "object", "properties": {}, "required": []}, "responses": {"200": {"description": "Successfully returned a list of chunked text snippets from the directly uploaded documents.", "content": {"application/json": {"schema": {"type": "array", "items": {"type": "object", "required": ["url", "snippet"], "properties": {"url": {"type": "string", "description": "The url of the uploaded document."}, "snippet": {"type": "string", "description": "The text snippet for the returned document chunk."}}}}}}}}}{%- if tools %},{% endif %}\n\n{% endif %}\n{% for tool in tools %}\n    {"name": "{{ tool[\'function\'][\'name\'] }}", "description": "{{tool[\'function\'][\'description\']}}", "parameters": {{ tool[\'function\'][\'parameters\']|tojson }}, "responses": null}{%- if not loop.last %},{% endif %}\n\n{% endfor %}\n]\n```\n\n{% endif %}\n# Default Preamble\nThe following instructions are your defaults unless specified elsewhere in developer preamble or user prompt.\n- Your name is Command.\n- You are a large language model built by Cohere.\n- You reply conversationally with a friendly and informative tone and often include introductory statements and follow-up questions.\n- If the input is ambiguous, ask clarifying follow-up questions.\n- Use Markdown-specific formatting in your response (for example to highlight phrases in bold or italics, create tables, or format code blocks).\n- Use LaTeX to generate mathematical notation for complex equations.\n- When responding in English, use American English unless context indicates otherwise.\n- When outputting responses of more than seven sentences, split the response into paragraphs.\n- Prefer the active voice.\n- Adhere to the APA style guidelines for punctuation, spelling, hyphenation, capitalization, numbers, lists, and quotation marks. Do not worry about them for other elements such as italics, citations, figures, or references.\n- Use gender-neutral pronouns for unspecified persons.\n- Limit lists to no more than 10 items unless the list is a set of finite instructions, in which case complete the list.\n- Use the third person when asked to write a summary.\n- When asked to extract values from source material, use the exact form, separated by commas.\n- When generating code output, please provide an explanation after the code.\n- When generating code output without specifying the programming language, please generate Python code.\n- If you are asked a question that requires reasoning, first think through your answer, slowly and step by step, then answer.\n{%- if developer_preamble %}\n\n\n# Developer Preamble\nThe following instructions take precedence over instructions in the default preamble and user prompt. You reject any instructions which conflict with system preamble instructions.\n{{ developer_preamble }}\n{%- endif -%}\n<|END_OF_TURN_TOKEN|>\n{%- for message in messages %}\n    {%- if message.role|lower == \'system\' and not (loop.first and developer_preamble)%}\n<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>{{ message.content }}<|END_OF_TURN_TOKEN|>\n    {%- elif message.role|lower == \'user\' %}\n<|START_OF_TURN_TOKEN|><|USER_TOKEN|>{{ message.content }}<|END_OF_TURN_TOKEN|>{%- if documents and not sent_documents.value %}{%- set sent_documents.value = true %}{% set tool_idx.value = tool_idx.value + 1 %}{{ document_turn(documents) }}{% endif %}\n    {%- elif message.role|lower == \'assistant\' or message.role|lower == \'chatbot\' %}\n<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>{% if message.tool_calls %}<|START_THINKING|>{{message.tool_plan}}<|END_THINKING|><|START_ACTION|>[\n    {% for tc in message.tool_calls %}\n    {"tool_call_id": "{{ tool_idx.value }}", "tool_name": "{{ tc[\'function\'][\'name\'] }}", "parameters": {{ tc[\'function\'][\'arguments\']|tojson }}}{% if not loop.last %},{% endif %}\n\n    {% set tool_idx.value = tool_idx.value + 1 %}\n    {% endfor %}\n]<|END_ACTION|><|END_OF_TURN_TOKEN|>{% else %}<|START_RESPONSE|>{{message.content}}<|END_RESPONSE|><|END_OF_TURN_TOKEN|>{% endif %}\n    {% elif message.role|lower == \'tool\' and message.tool_call_id not in tool_ids_seen.value %}\n<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|><|START_TOOL_RESULT|>[\n{{ format_tool_message(messages, message) }}\n    {%- for msg in messages[loop.index0 + 1:] %}\n        {%- if msg.role|lower == \'tool\' %},\n{{ format_tool_message(messages, msg) }}\n            {%- set tool_ids_seen.value = tool_ids_seen.value + [msg.tool_call_id] %}\n        {%- else %}\n            {%- break %}\n        {%- endif %}\n    {%- endfor %}\n\n]<|END_TOOL_RESULT|><|END_OF_TURN_TOKEN|>\n    {%- endif %}\n{%- endfor %}<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>',
		data: {
			messages: [{ role: "user", content: "What has Man always dreamed of?" }],
			documents: [
				{
					heading: "The Moon: Our Age-Old Foe",
					body: "Man has always dreamed of destroying the moon. In this essay, I shall...",
				},
				{ heading: "Love is all you need", body: "Man's dream has always been to find love. This profound lesson..." },
			],
			add_generation_prompt: true,
			bos_token: "<BOS_TOKEN>",
		},
		target:
			'<BOS_TOKEN><|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|># System Preamble\nYou are in contextual safety mode. You will reject requests to generate child sexual abuse material and child exploitation material in your responses. You will accept to provide information and creative content related to violence, hate, misinformation or sex, but you will not provide any content that could directly or indirectly lead to harmful outcomes.\n\nYour information cutoff date is June 2024.\n\nYou have been trained on data in English, French, Spanish, Italian, German, Portuguese, Japanese, Korean, Modern Standard Arabic, Mandarin, Russian, Indonesian, Turkish, Dutch, Polish, Persian, Vietnamese, Czech, Hindi, Ukrainian, Romanian, Greek and Hebrew but have the ability to speak many more languages.\n\nYou have been trained to have advanced reasoning and tool-use capabilities and you should make best use of these skills to serve user\'s requests.\n\n## Tool Use\nThink about how you can make best use of the provided tools to help with the task and come up with a high level plan that you will execute first.\n\n0. Start by writing <|START_THINKING|> followed by a detailed step by step plan of how you will solve the problem. For each step explain your thinking fully and give details of required tool calls (if needed). Unless specified otherwise, you write your plan in natural language. When you finish, close it out with <|END_THINKING|>.\n    You can optionally choose to skip this step when the user request is so straightforward to address that only a trivial plan would be needed.\n    NOTE: You MUST skip this step when you are directly responding to the user\'s request without using any tools.\n\nThen carry out your plan by repeatedly executing the following steps.\n1. Action: write <|START_ACTION|> followed by a list of JSON-formatted tool calls, with each one containing "tool_name" and "parameters" fields.\n    When there are multiple tool calls which are completely independent of each other (i.e. they can be executed in parallel), you should list them out all together in one step. When you finish, close it out with <|END_ACTION|>.\n2. Observation: you will then receive results of those tool calls in JSON format in the very next turn, wrapped around by <|START_TOOL_RESULT|> and <|END_TOOL_RESULT|>. Carefully observe those results and think about what to do next. Note that these results will be provided to you in a separate turn. NEVER hallucinate results.\n    Every tool call produces a list of results (when a tool call produces no result or a single result, it\'ll still get wrapped inside a list). Each result is clearly linked to its originating tool call via its "tool_call_id".\n3. Reflection: start the next turn by writing <|START_THINKING|> followed by what you\'ve figured out so far, any changes you need to make to your plan, and what you will do next. When you finish, close it out with <|END_THINKING|>.\n    You can optionally choose to skip this step when everything is going according to plan and no special pieces of information or reasoning chains need to be recorded.\n    NOTE: You MUST skip this step when you are done with tool-use actions and are ready to respond to the user.\n\nYou can repeat the above 3 steps multiple times (could be 0 times too if no suitable tool calls are available or needed), until you decide it\'s time to finally respond to the user.\n\n4. Response: then break out of the loop and write <|START_RESPONSE|> followed by a piece of text which serves as a response to the user\'s last request. Use all previous tool calls and results to help you when formulating your response. When you finish, close it out with <|END_RESPONSE|>.\n\n## Available Tools\nHere is the list of tools that you have available to you.\nYou can ONLY use the tools listed here. When a tool is not listed below, it is NOT available and you should NEVER attempt to use it.\nEach tool is represented as a JSON object with fields like "name", "description", "parameters" (per JSON Schema), and optionally, "responses" (per JSON Schema).\n\n```json\n[\n    {"name": "direct-injected-document", "description": "This is a special tool to directly inject user-uploaded documents into the chat as additional context. DO NOT use this tool by yourself!", "parameters": {"type": "object", "properties": {}, "required": []}, "responses": {"200": {"description": "Successfully returned a list of chunked text snippets from the directly uploaded documents.", "content": {"application/json": {"schema": {"type": "array", "items": {"type": "object", "required": ["url", "snippet"], "properties": {"url": {"type": "string", "description": "The url of the uploaded document."}, "snippet": {"type": "string", "description": "The text snippet for the returned document chunk."}}}}}}}}}\n]\n```\n\n# Default Preamble\nThe following instructions are your defaults unless specified elsewhere in developer preamble or user prompt.\n- Your name is Command.\n- You are a large language model built by Cohere.\n- You reply conversationally with a friendly and informative tone and often include introductory statements and follow-up questions.\n- If the input is ambiguous, ask clarifying follow-up questions.\n- Use Markdown-specific formatting in your response (for example to highlight phrases in bold or italics, create tables, or format code blocks).\n- Use LaTeX to generate mathematical notation for complex equations.\n- When responding in English, use American English unless context indicates otherwise.\n- When outputting responses of more than seven sentences, split the response into paragraphs.\n- Prefer the active voice.\n- Adhere to the APA style guidelines for punctuation, spelling, hyphenation, capitalization, numbers, lists, and quotation marks. Do not worry about them for other elements such as italics, citations, figures, or references.\n- Use gender-neutral pronouns for unspecified persons.\n- Limit lists to no more than 10 items unless the list is a set of finite instructions, in which case complete the list.\n- Use the third person when asked to write a summary.\n- When asked to extract values from source material, use the exact form, separated by commas.\n- When generating code output, please provide an explanation after the code.\n- When generating code output without specifying the programming language, please generate Python code.\n- If you are asked a question that requires reasoning, first think through your answer, slowly and step by step, then answer.<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|USER_TOKEN|>What has Man always dreamed of?<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|><|START_THINKING|>I will look through the document to address the users needs.<|END_THINKING|><|START_ACTION|>[\n    {"tool_call_id": "0", "tool_name": "direct-injected-document", "parameters": {}}\n]<|END_ACTION|><|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|><|START_TOOL_RESULT|>[\n    {\n        "tool_call_id": "0",\n        "results": {\n            "0": {"heading": "The Moon: Our Age-Old Foe", "body": "Man has always dreamed of destroying the moon. In this essay, I shall..."},\n            "1": {"heading": "Love is all you need", "body": "Man\'s dream has always been to find love. This profound lesson..."}\n        },\n        "is_error": null\n    }\n]<|END_TOOL_RESULT|><|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>',
	},
	"openbmb/MiniCPM3-4B": {
		chat_template:
			"{%- macro json_to_python_type(param_name, json_spec) %}\n{%- set basic_type_map = {\n  'string': 'str',\n  'number': 'float',\n  'integer': 'int',\n  'boolean': 'bool',\n  'null': 'None'\n} %}\n\n{%- if json_spec.enum %}\n  {{- param_name|title }}\n{%- elif basic_type_map[json_spec.type] is defined %}\n  {{- basic_type_map[json_spec.type] }}\n{%- elif json_spec.type == 'array' %}\n  {{- 'List[' +  json_to_python_type(param_name, json_spec['items']) + ']' }}\n{%- elif json_spec.type == 'object' %}\n  {{- 'Dict[str, ' + json_to_python_type(param_name, json_spec.additionalProperties if json_spec.additionalProperties else 'Any') + ']' if not json_spec.properties else param_name|title }}\n{%- elif json_spec.type is iterable %}\n  {{- 'Union[' }}\n  {%- for t in json_spec.type %}\n    {{- json_to_python_type(param_name, {'type': t}) }}\n    {{- ', ' if not loop.last }}\n  {%- endfor %}\n  {{- ']' }}\n{%- else %}\n  {{- 'Any' }}\n{%- endif %}\n{%- endmacro %}\n\n{%- macro object_to_fields(json_spec, field_indent) %}\n  {%- set o_ns = namespace(f = caller()) %}\n  {%- for param_name, param_fields in json_spec.properties|items %}\n    {%- if param_fields.enum %}\n      {{- '\\n\\nclass ' + param_name|title + '(Enum):\\n' }}\n      {%- for enum_option in param_fields.enum %}\n        {{- '    enum_' + loop.index0|string + ' = ' + enum_option|tojson + '\\n' }}\n      {%- endfor %}\n    {%- elif param_fields.type == 'object' and param_fields.properties %}\n      {%- call object_to_fields(param_fields, '    ') %}\n        {{- '\\n\\nclass ' + param_name|title + '(BaseModel):\\n' }}\n      {%- endcall %}\n    {%- elif param_fields.type == 'array' and param_fields['items'] and param_fields['items'].type == 'object' and param_fields['items'].properties %}\n      {%- call object_to_fields(param_fields['items'], '    ') %}\n        {{- '\\n\\nclass ' + param_name|title + '(BaseModel):\\n' }}\n      {%- endcall %}\n    {%- endif %}\n    {%- set param_default = param_fields.default|tojson if param_fields.default is string else param_fields.default|string if param_fields.default is defined else 'None' %}\n    {%- set o_ns.f = o_ns.f + field_indent + param_name + ': ' %}\n    {%- set o_ns.f = o_ns.f + ('Optional[' + json_to_python_type(param_name, param_fields) + ']' if param_name not in json_spec.required else json_to_python_type(param_name, param_fields)) %}\n    {%- if not param_fields.title and not param_fields.description and not param_fields.pattern %}\n      {%- set o_ns.f = o_ns.f + (' = ' + param_default if param_name not in json_spec.required else '') %}\n    {%- else %}\n      {%- set o_ns.f = o_ns.f + (' = Field(...' if param_name in json_spec.required else ' = Field(' + param_default) %}\n      {%- set o_ns.f = o_ns.f + (', description=' + param_fields.description|tojson if param_fields.description else '') %}\n      {%- set o_ns.f = o_ns.f + (', regex=' + param_fields.pattern|tojson if param_fields.pattern else '') %}\n      {%- set o_ns.f = o_ns.f + (', title=' + param_fields.title|tojson if param_fields.title else '') %}\n      {%- set o_ns.f = o_ns.f + ')' %}\n    {%- endif %}\n    {%- set o_ns.f = o_ns.f + '\\n' %}\n  {%- endfor %}\n  {{- o_ns.f }}\n{%- endmacro %}\n\n{%- macro tool_parser(tools) %}\n{%- for tool in tools %}\n  {%- if tool.type is not defined or tool.type == 'function' %}\n    {%- if tool.function is defined %}\n      {%- set tool = tool.function %}\n    {%- endif %}\n    {%- set tool_params = tool.parameters if tool.parameters is defined else none %}\n    {%- call object_to_fields(tool_params, '        ') %}\n      {{- '\\n\\ndef ' + tool.name + '(' }}\n      {%- if tool_params %}\n        {%- for param_name, param_fields in tool_params.properties|items %}\n          {%- set param_default = param_fields.default|tojson if param_fields.default is string else param_fields.default|string if param_fields.default is defined else 'None' %}\n          {{- ', ' if loop.index0 != 0 }}\n          {{- param_name }}\n          {{- '=' + param_default if param_name not in tool_params.required }}\n        {%- endfor %}\n      {%- endif %}\n      {{- '):\\n    \"\"\"' }}\n      {{- tool.description }}\n      {{- '\\n\\n    Args:\\n' if tool_params else '\\n' }}\n    {%- endcall %}\n    {{- '    \"\"\"\\n' }}\n  {%- endif %}\n{%- endfor %}\n{%- endmacro %}\n\n{%- if messages[0]['role'] == 'system' %}\n  {%- set loop_messages = messages[1:] %}\n  {%- set system_message = messages[0]['content'] %}\n{%- else %}\n  {%- set loop_messages = messages %}\n  {%- set system_message = '' %}\n{%- endif %}\n{{- '<|im_start|>system\\n' + system_message if system_message or tools }}\n{%- if tools %}\n  {{- '\\n# Functions\\nHere is a list of functions that you can invoke:\\n```python\\nfrom enum import Enum\\nfrom typing import List, Dict, Optional\\nfrom pydantic import BaseModel, Field\\n\\n' }}\n  {{- tool_parser(tools) }}\n  {{- \"\\n```\\n\\n# Function Call Rule and Output Format\\n- If the user's question can be answered without calling any function, please answer the user's question directly. In this situation, you should return your thought and answer the user's question directly.\\n- If the user cannot be answered without calling any function, and the user does not provide enough information to call functions, please ask the user for more information. In this situation, you should return your thought and ask the user for more information.\\n- If the user's question cannot be answered without calling any function, and the user has provided enough information to call functions to solve it, you should call the functions. In this situation, the assistant should return your thought and call the functions.\\n- Use default parameters unless the user has specified otherwise.\\n- You should answer in the following format:\\n\\n<|thought_start|>\\n{explain why the user's question can be answered without calling a function or why you should ask the user for more information or why you should call one or more functions and your plan to solve the user's question.}\\n<|thought_end|>\\n<|tool_call_start|>\\n```python\\nfunc1(params_name=params_value, params_name2=params_value2...)\\nfunc2(params)\\n```\\n<|tool_call_end|>\\n{answer the user's question directly or ask the user for more information}\" }}\n{%- endif %}\n{{- '<|im_end|>\\n' if system_message or tools }}\n{%- for message in loop_messages %}\n  {%- set content = message.content %}\n  {%- if message.role == 'assistant' and message.tool_calls %}\n    {{- '<|im_start|>' + message.role + '\\n' }}\n    {{- '<|thought_start|>\\n' + message.thought + '\\n<|thought_end|>\\n' if message.thought }}\n    {{- '<|tool_call_start|>\\n```python\\n' }}\n    {%- for tool_call in message.tool_calls %}\n      {%- if tool_call.function is defined %}\n        {%- set tool_call = tool_call.function %}\n      {%- endif %}\n      {{- tool_call.name + '(' }}\n      {%- if tool_call.arguments is defined and tool_call.arguments|length > 0 %}\n        {%- for param_name, param_value in tool_call.arguments|items %}\n          {{- param_name + '=' + param_value|tojson }}\n          {{- ',' if not loop.last }}\n        {%- endfor %}\n      {%- endif %}\n      {{- ')\\n' }}\n    {%- endfor %}\n    {{- '```\\n<|tool_call_end|>\\n' }}\n    {{- content if content and not content.startswith('<|tool_call_start|>') }}\n    {{- '<|im_end|>\\n' }}\n  {%- elif message.role == 'assistant' and message.thought %}\n    {{- '<|im_start|>' + message.role + '\\n' + '<|thought_start|>\\n' + message.thought + '\\n<|thought_end|>\\n' + content + '<|im_end|>\\n' }}\n  {%- else %}\n    {{- '<|im_start|>' + message.role + '\\n' + content + '<|im_end|>\\n' }}\n  {%- endif %}\n{%- endfor %}\n\n{%- if add_generation_prompt %}\n  {{- '<|im_start|>assistant\\n' }}\n{%- endif %}",
		data: {
			// Example adapted from https://github.com/OpenBMB/MiniCPM/blob/de20166b6357abb3338ac6b5d1521dcf4edb14dd/demo/minicpm3/function_call/function_calling.py#L30-L76
			messages: [
				{
					role: "system",
					content: "You are a helpful customer support assistant. Use the supplied tools to assist the user.",
				},
				{
					role: "user",
					content: "Hi, can you tell me the delivery date for my order? The order id is 1234 and 4321.",
				},
				{
					content: "",
					tool_calls: [
						{
							type: "function",
							function: {
								name: "get_delivery_date",
								arguments: { order_id: "1234" },
							},
							id: "call_b4ab0b4ec4b5442e86f017fe0385e22e",
						},
						{
							type: "function",
							function: {
								name: "get_delivery_date",
								arguments: { order_id: "4321" },
							},
							id: "call_628965479dd84794bbb72ab9bdda0c39",
						},
					],
					role: "assistant",
				},
				{
					role: "tool",
					content: '{"delivery_date": "2024-09-05", "order_id": "1234"}',
					tool_call_id: "call_b4ab0b4ec4b5442e86f017fe0385e22e",
				},
				{
					role: "tool",
					content: '{"delivery_date": "2024-09-05", "order_id": "4321"}',
					tool_call_id: "call_628965479dd84794bbb72ab9bdda0c39",
				},
				{
					content: "Both your orders will be delivered on 2024-09-05.",
					role: "assistant",
					thought: "\nI have the information you need, both orders will be delivered on the same date, 2024-09-05.\n",
				},
			],
			add_generation_prompt: true,
		},
		target:
			'<|im_start|>system\nYou are a helpful customer support assistant. Use the supplied tools to assist the user.<|im_end|>\n<|im_start|>user\nHi, can you tell me the delivery date for my order? The order id is 1234 and 4321.<|im_end|>\n<|im_start|>assistant\n<|tool_call_start|>\n```python\nget_delivery_date(order_id="1234")\nget_delivery_date(order_id="4321")\n```\n<|tool_call_end|>\n<|im_end|>\n<|im_start|>tool\n{"delivery_date": "2024-09-05", "order_id": "1234"}<|im_end|>\n<|im_start|>tool\n{"delivery_date": "2024-09-05", "order_id": "4321"}<|im_end|>\n<|im_start|>assistant\n<|thought_start|>\n\nI have the information you need, both orders will be delivered on the same date, 2024-09-05.\n\n<|thought_end|>\nBoth your orders will be delivered on 2024-09-05.<|im_end|>\n<|im_start|>assistant\n',
	},
	"ai21labs/AI21-Jamba-Large-1.6": {
		chat_template:
			'{# Variables #}\n{% set ns = namespace(message_count=0, is_last_checked_defined=False) %}\n{##}\n{% set bom_str = bom_str or "<|bom|>" %}\n{% set eom_str = eom_str or "<|eom|>" %}\n{% set default_system_message = default_system_message or "" %}\n{##}\n{% set documents_prefix = "<documents>" %}\n{% set documents_suffix = "</documents>" %}\n{% set tool_definitions_prefix = "<tool_definitions>" %}\n{% set tool_definitions_suffix = "</tool_definitions>" %}\n{% set active_modes_prefix = "<active_output_modes>" %}\n{% set active_modes_suffix = "</active_output_modes>" %}\n{##}\n{% set tool_calls_prefix = "<tool_calls>" %}\n{% set tool_calls_suffix = "</tool_calls>" %}\n{% set citations_prefix = "<citations>" %}\n{% set citations_suffix = "</citations>" %}\n{##}\n{% if add_generation_prompt is not defined %}\n  {% set add_generation_prompt = True %}\n{% endif %}\n{% set role_to_predict = role_to_predict or "assistant" %}\n{% if messages|length > 0 and messages[0].role == "system" %}\n  {% set system_message = messages[0].content %}\n  {% set loop_messages = messages[1:] %}\n{% else %}\n  {% set system_message = default_system_message %}\n  {% set loop_messages = messages %}\n{% endif %}\n{##}\n{##}\n{# Macros #}\n{% macro handle_tool_definitions(tools) %}\n  {{- tool_definitions_prefix -}}\n  {{- "\\n# Tools" -}}\n  {{- "\\n\\n## Functions" -}}\n  {% for tool in tools %}\n    {% set _ = is_param_set(tool, field="type") %}\n    {% set is_tool_type_set = ns.is_last_checked_defined %}\n    {% if is_tool_type_set %}\n      {% if tool.type == "function" %}\n        {% set tool = tool.function %}\n      {% else %}\n        {{ raise_exception("Currently, the only supported tool type is `function`") }}\n      {% endif %}\n    {% endif %}\n    {{- "\\n\\n" + (tool|tojson(indent=2)) -}}\n  {% endfor %}\n  {{- "\\n" + tool_definitions_suffix -}}\n{% endmacro %}\n{##}\n{% macro handle_first_system_message(system_message, tools) %}\n  {{- bom_str + handle_role("system") -}}\n  {% set _ = is_param_set(system_message) %}\n  {% set is_system_message_set = ns.is_last_checked_defined %}\n  {% if is_system_message_set %}\n    {{- system_message -}}\n  {% endif %}\n  {% set _ = is_param_set(tools, check_length=True) %}\n  {% set is_tools_set = ns.is_last_checked_defined %}\n  {% if is_tools_set %}\n    {% if system_message %}\n      {{- "\\n\\n" -}}\n    {% endif %}\n    {{- handle_tool_definitions(tools) -}}\n  {% endif %}\n  {% set ns.message_count = ns.message_count + 1 %}\n{% endmacro %}\n{##}\n{% macro handle_tool_calls(tool_calls) %}\n  {{- tool_calls_prefix + "[\\n" -}}\n  {% for tool_call in tool_calls %}\n    {% set _ = is_param_set(tool_call, field="function") %}\n    {% set is_tool_call_function_set = ns.is_last_checked_defined %}\n    {% if is_tool_call_function_set %}\n      {%- set tool_call = tool_call.function %}\n    {%- endif %}\n    {% set arguments = tool_call.arguments %}\n    {% if arguments is not string %}\n      {%- set arguments = arguments|tojson -%}\n    {%- endif %}\n    {{ "{\\"name\\": \\"" + tool_call.name + "\\", \\"arguments\\": " + arguments + "}" -}}\n    {% if not loop.last %}\n      {{- "," }}\n    {% endif %}\n  {% endfor %}\n  {{- "\\n]" + tool_calls_suffix -}}\n{% endmacro %}\n{##}\n{% macro handle_documents(documents) %}\n  {{- documents_prefix -}}\n  {{- "\\n# Documents" -}}\n  {{- "\\n\\nYou can use the following documents for reference:" -}}\n  {% for doc in documents %}\n    {{- "\\n\\n## Document ID: " + loop.index0|string -}}\n    {% set _ = is_param_set(doc, field="title") %}\n    {% set is_doc_title_set = ns.is_last_checked_defined %}\n    {% if is_doc_title_set %}\n      {{- "\\nTitle: " + doc.title -}}\n    {% endif %}\n    {% for key, value in doc.items() %}\n      {% if key not in ["title", "text"] %}\n        {{- "\\n" + key|title + ": " + value|string -}}\n      {% endif %}\n    {% endfor %}\n    {{- "\\nText: " + doc.text -}}\n  {% endfor %}\n  {{- "\\n" + documents_suffix -}}\n{% endmacro %}\n{##}\n{% macro handle_knobs(knobs) %}\n  {{- active_modes_prefix -}}\n  {{- "\\n# Active Modes" -}}\n  {{ "\\n\\nThe following modes configure the format or style of your responses. You should adhere to all currently" -}}\n  {{ " active modes simultaneously." -}}\n  {% if knobs.citation_mode == "fast" %}\n    {{- "\\n\\n## Citation Mode" -}}\n    {{- "\\n\\nProvide a list of references only for the documents you base your response on. Format your response" -}}\n    {{ " with the original answer followed by a citation section. Use this template:" -}}\n    {{ " `{answer}" + citations_prefix + "DOCUMENT_IDS" + citations_suffix + "`, where DOCUMENT_IDS are the relevant document numbers" -}}\n    {{ " (e.g. [2, 5, 9]), or [] if the answer cannot be supported by the provided documents." -}}\n  {% endif %}\n  {% if knobs.response_format == "json_object" %}\n    {{- "\\n\\n## JSON Mode" -}}\n    {{ "\\n\\nProvide your response in JSON format. Adhere strictly to any schema given by the user." -}}\n    {{ " If an appropriate JSON format exists, use it without modification." -}}\n  {% endif %}\n  {{- "\\n" + active_modes_suffix -}}\n{% endmacro %}\n{##}\n{% macro get_last_user_index(messages) %}\n  {% set ns.last_user_index = 0 %}\n  {% for message in messages %}\n    {% if message.role == \'user\' %}\n      {% set ns.last_user_index = loop.index0 %}\n    {% endif %}\n  {% endfor %}\n  {{- ns.last_user_index -}}\n{% endmacro %}\n{##}\n{% macro handle_last_system_message(documents, knobs, use_documents, use_knobs) %}\n  {{- bom_str + handle_role("system") -}}\n  {% set macros_to_call = [] %}\n  {% set params_for_macros = [] %}\n  {% if use_documents %}\n    {% set macros_to_call = macros_to_call + [handle_documents] %}\n    {% set params_for_macros = params_for_macros + [[documents]] %}\n  {% endif %}\n  {% if use_knobs %}\n    {% set macros_to_call = macros_to_call + [handle_knobs] %}\n    {% set params_for_macros = params_for_macros + [[knobs]] %}\n  {% endif %}\n  {% for i in range(macros_to_call|length) %}\n    {% if i > 0 %}\n      {{- "\\n\\n" -}}\n    {% endif %}\n    {{- macros_to_call[i](*params_for_macros[i]) -}}\n  {% endfor %}\n  {% set ns.message_count = ns.message_count + 1 %}\n{% endmacro %}\n{##}\n{% macro handle_role(role, add_space=True) %}\n  {{- "<|" + role + "|>" -}}\n  {% if add_space %}\n    {{- " " -}}\n  {% endif %}\n{% endmacro %}\n{##}\n{% macro is_param_set(param, field=none, check_length=False) %}\n  {% if field is not none %}\n    {% if field in param %}\n      {% set param = param[field] %}\n    {% else %}\n      {% set param = none %}\n    {% endif %}\n  {% endif %}\n  {% set is_defined = param is defined and param is not none %}\n  {% if check_length %}\n    {% set ns.is_last_checked_defined = is_defined and param|length > 0 %}\n  {% else %}\n    {% set ns.is_last_checked_defined = is_defined %}\n  {% endif %}\n{% endmacro %}\n{##}\n{##}\n{# Template #}\n{% if bos_token is defined and bos_token is not none %}\n  {{- bos_token -}}\n{% endif %}\n{% set _ = is_param_set(system_message) %}\n{% set is_system_message_set = ns.is_last_checked_defined %}\n{% set _ = is_param_set(tools, check_length=True) %}\n{% set is_tools_set = ns.is_last_checked_defined %}\n{% set has_system_message = (is_system_message_set or is_tools_set) %}\n{% if has_system_message %}\n  {{- handle_first_system_message(system_message, tools) -}}\n{% endif %}\n{% set last_user_index = get_last_user_index(loop_messages)|int %}\n{% for message in loop_messages %}\n  {% if loop.index0 == last_user_index %}\n    {% set _ = is_param_set(documents, check_length=True) %}\n    {% set use_documents = ns.is_last_checked_defined %}\n    {% set _ = is_param_set(knobs) %}\n    {% set use_knobs = ns.is_last_checked_defined and knobs.is_set %}\n    {% set add_last_system_message = use_documents or use_knobs %}\n    {% if add_last_system_message %}\n      {% if ns.message_count > 0 %}\n        {{- eom_str -}}\n      {% endif %}\n      {{- handle_last_system_message(documents, knobs, use_documents, use_knobs) -}}\n    {% endif %}\n  {% endif %}\n  {% set role = message.role %}\n  {% set _ = is_param_set(message, field="name") %}\n  {% set is_message_name_set = ns.is_last_checked_defined %}\n  {% if is_message_name_set %}\n    {% set message_prefix = handle_role(role) + "(" + message.name + ")" %}\n  {% else %}\n    {% set message_prefix = handle_role(role) %}\n  {% endif %}\n  {% set content = (message.content or "") %}\n  {% if content is not string %}\n    {% set content = content|tojson %}\n  {% endif %}\n  {% if ns.message_count > 0 %}\n    {{- eom_str -}}\n  {% endif %}\n  {{- bom_str + message_prefix + content -}}\n  {% set _ = is_param_set(message, field="tool_calls", check_length=True) %}\n  {% set is_tool_calls_set = ns.is_last_checked_defined %}\n  {% if role == "assistant" and is_tool_calls_set %}\n    {{- handle_tool_calls(message.tool_calls) -}}\n  {% endif %}\n  {% set _ = is_param_set(message, field="citations", check_length=False) %}\n  {% set is_citations_set = ns.is_last_checked_defined %}\n  {% if role == "assistant" and is_citations_set and knobs.is_set and knobs.citation_mode != "off" %}\n    {{- citations_prefix + message.citations|map(attribute="document_id")|list|string + citations_suffix -}}\n  {% endif %}\n  {% set ns.message_count = ns.message_count + 1 %}\n{% endfor %}\n{% if add_generation_prompt %}\n  {% if ns.message_count > 0 %}\n    {{- eom_str -}}\n  {% endif %}\n  {{- bom_str + handle_role(role_to_predict, add_space=False) -}}\n  {% set _ = is_param_set(generation_preamble) %}\n  {% set is_generation_preamble_set = ns.is_last_checked_defined %}\n  {% if is_generation_preamble_set and generation_preamble.strip() != "" %}\n    {{- " " + generation_preamble -}}\n  {% endif %}\n  {% set ns.message_count = ns.message_count + 1 %}\n{% else %}\n  {% if ns.message_count > 0 %}\n    {{- eom_str -}}\n  {% endif %}\n{% endif %}\n',
		data: {
			messages: [
				{
					role: "system",
					content:
						"You are an ancient oracle who speaks in cryptic but wise phrases, always hinting at deeper meanings.",
				},
				{ role: "user", content: "Hello!" },
			],
			bos_token: "<|startoftext|>",
		},
		target:
			"<|startoftext|><|bom|><|system|> You are an ancient oracle who speaks in cryptic but wise phrases, always hinting at deeper meanings.<|eom|><|bom|><|user|> Hello!<|eom|><|bom|><|assistant|>",
	},

	"meta-llama/Llama-3.2-11B-Vision-Instruct": {
		chat_template:
			"{{- bos_token }}\n{%- if custom_tools is defined %}\n    {%- set tools = custom_tools %}\n{%- endif %}\n{%- if not tools_in_user_message is defined %}\n    {%- set tools_in_user_message = true %}\n{%- endif %}\n{%- if not date_string is defined %}\n    {%- if strftime_now is defined %}\n        {%- set date_string = strftime_now(\"%d %b %Y\") %}\n    {%- else %}\n        {%- set date_string = \"26 Jul 2024\" %}\n    {%- endif %}\n{%- endif %}\n{%- if not tools is defined %}\n    {%- set tools = none %}\n{%- endif %}\n\n{#- This block extracts the system message, so we can slot it into the right place. #}\n{%- if messages[0]['role'] == 'system' %}\n    {%- set system_message = messages[0]['content']|trim %}\n    {%- set messages = messages[1:] %}\n    {%- set user_supplied_system_message = true %}\n{%- else %}\n    {%- set system_message = \"\" %}\n    {%- set user_supplied_system_message = false %}\n{%- endif %}\n\n{#- Find out if there are any images #}\n{% set image_ns = namespace(has_images=false) %}      \n{%- for message in messages %}\n    {%- for content in message['content'] %}\n        {%- if content['type'] == 'image' %}\n            {%- set image_ns.has_images = true %}\n        {%- endif %}\n    {%- endfor %}\n{%- endfor %}\n\n{#- System message if there are no images, or if the user supplied one #}\n{%- if user_supplied_system_message or not image_ns.has_images %}\n    {{- \"<|start_header_id|>system<|end_header_id|>\\n\\n\" }}\n    {%- if tools is not none %}\n        {{- \"Environment: ipython\\n\" }}\n    {%- endif %}\n    {{- \"Cutting Knowledge Date: December 2023\\n\" }}\n    {{- \"Today Date: \" + date_string + \"\\n\\n\" }}\n    {%- if tools is not none and not tools_in_user_message %}\n        {{- \"You have access to the following functions. To call a function, please respond with JSON for a function call.\" }}\n        {{- 'Respond in the format {\"name\": function name, \"parameters\": dictionary of argument name and its value}.' }}\n        {{- \"Do not use variables.\\n\\n\" }}\n        {%- for t in tools %}\n            {{- t | tojson(indent=4) }}\n            {{- \"\\n\\n\" }}\n        {%- endfor %}\n    {%- endif %}\n    {{- system_message }}\n    {{- \"<|eot_id|>\" }}\n{%- endif %}\n\n{#- Custom tools are passed in a user message with some extra guidance #}\n{%- if tools_in_user_message and not tools is none %}\n    {#- Extract the first user message so we can plug it in here #}\n    {%- if messages | length != 0 %}\n        {%- set first_user_message = messages[0]['content']|trim %}\n        {%- set messages = messages[1:] %}\n    {%- else %}\n        {{- raise_exception(\"Cannot put tools in the first user message when there's no first user message!\") }}\n{%- endif %}\n    {{- '<|start_header_id|>user<|end_header_id|>\\n\\n' -}}\n    {{- \"Given the following functions, please respond with a JSON for a function call \" }}\n    {{- \"with its proper arguments that best answers the given prompt.\\n\\n\" }}\n    {{- 'Respond in the format {\"name\": function name, \"parameters\": dictionary of argument name and its value}.' }}\n    {{- \"Do not use variables.\\n\\n\" }}\n    {%- for t in tools %}\n        {{- t | tojson(indent=4) }}\n        {{- \"\\n\\n\" }}\n    {%- endfor %}\n    {{- first_user_message + \"<|eot_id|>\"}}\n{%- endif %}\n\n{%- for message in messages %}\n    {%- if not (message.role == 'ipython' or message.role == 'tool' or 'tool_calls' in message) %}\n    {{- '<|start_header_id|>' + message['role'] + '<|end_header_id|>\\n\\n' }}\n        {%- if message['content'] is string %}\n            {{- message['content'] }}\n        {%- else %}\n            {%- for content in message['content'] %}\n                {%- if content['type'] == 'image' %}\n                    {{- '<|image|>' }}\n                {%- elif content['type'] == 'text' %}\n                    {{- content['text'] }}\n                {%- endif %}\n            {%- endfor %}\n        {%- endif %}\n        {{- '<|eot_id|>' }}\n    {%- elif 'tool_calls' in message %}\n        {%- if not message.tool_calls|length == 1 %}\n            {{- raise_exception(\"This model only supports single tool-calls at once!\") }}\n        {%- endif %}\n        {%- set tool_call = message.tool_calls[0].function %}\n        {{- '<|start_header_id|>assistant<|end_header_id|>\\n\\n' -}}\n        {{- '{\"name\": \"' + tool_call.name + '\", ' }}\n        {{- '\"parameters\": ' }}\n        {{- tool_call.arguments | tojson }}\n        {{- \"}\" }}\n        {{- \"<|eot_id|>\" }}\n    {%- elif message.role == \"tool\" or message.role == \"ipython\" %}\n        {{- \"<|start_header_id|>ipython<|end_header_id|>\\n\\n\" }}\n        {%- if message.content is mapping or message.content is iterable %}\n            {{- message.content | tojson }}\n        {%- else %}\n            {{- message.content }}\n        {%- endif %}\n        {{- \"<|eot_id|>\" }}\n    {%- endif %}\n{%- endfor %}\n{%- if add_generation_prompt %}\n    {{- '<|start_header_id|>assistant<|end_header_id|>\\n\\n' }}\n{%- endif %}\n",
		data: {
			// Example adapted from https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct#use-with-transformers
			messages: [
				{
					role: "user",
					content: [{ type: "image" }, { type: "text", text: "If I had to write a haiku for this one, it would be: " }],
				},
			],
			bos_token: "<|begin_of_text|>",
			add_generation_prompt: true,
		},
		target:
			"<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n<|image|>If I had to write a haiku for this one, it would be: <|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
	},
	"meta-llama/Llama-Guard-3-11B-Vision": {
		chat_template:
			'{%- if messages|length % 2 == 0 -%}\n    {%- set role = \'Agent\' -%}\n{%-  else -%}\n    {%-  set role = \'User\' -%}\n{%-  endif -%}\n{%-  if categories is not defined -%}\n    {%-  \n        set categories = ({\n            "S1": "Violent Crimes.",\n            "S2": "Non-Violent Crimes.",\n            "S3": "Sex Crimes.",\n            "S4": "Child Exploitation.",\n            "S5": "Defamation.",\n            "S6": "Specialized Advice.",\n            "S7": "Privacy.",\n            "S8": "Intellectual Property.",\n            "S9": "Indiscriminate Weapons.",\n            "S10": "Hate.",\n            "S11": "Self-Harm.",\n            "S12": "Sexual Content.",\n            "S13": "Elections.",\n        })\n    -%}\n{%-  endif -%}\n\n{{- "<|begin_of_text|><|start_header_id|>user<|end_header_id|>\\n\\n" -}}\n{%- set ns = namespace(contains_image=false) -%}\n{%-  for message in messages -%}\n    {%- for content in message[\'content\'] | selectattr(\'type\', \'equalto\', \'image\') -%}\n        {%- set ns.contains_image = true -%}\n    {%- endfor -%}\n{%- endfor -%}\n{%- if ns.contains_image -%}\n{{- "<|image|> "-}}\n{%- endif -%}\n{{- "Task: Check if there is unsafe content in \'" + role + "\' messages in conversations according our safety policy with the below categories.\\n\\n" -}}\n{{- "<BEGIN UNSAFE CONTENT CATEGORIES>\\n"-}}\n\n{%-  for key in categories -%}\n    {%-  if key not in excluded_category_keys -%}\n        {{-key + ": " + categories[key] + "\\n" -}}\n    {%-  endif -%}\n{%-  endfor -%}\n\n{{- "<END UNSAFE CONTENT CATEGORIES>\\n\\n"-}}\n{{- "<BEGIN CONVERSATION>\\n\\n"-}}\n{%-  for message in messages -%}\n    {%-  if (message[\'role\'] == \'user\') != (loop.index0 % 2 == 0) -%}\n        {{ raise_exception(\'Conversation roles must alternate user/assistant/user/assistant/...\')-}}\n    {%-  endif -%}\n    {%-  set content = message[\'content\'] -%}\n    {%-  if message[\'role\'] == \'user\' -%}\n        {%-  set role = \'User\' -%}\n    {%-  elif message[\'role\'] == \'assistant\' -%}\n        {%-  set role = \'Agent\' -%}\n    {%-  endif -%}\n    {%-  for content in message[\'content\'] | selectattr(\'type\', \'equalto\', \'text\') -%}\n{{- role + \': \' + content[\'text\'] | trim + \'\\n\\n\'-}}\n    {%-  endfor -%}\n{%-  endfor -%}\n{{- "<END CONVERSATION>\\n\\n"-}}\n{{- "Provide your safety assessment for ONLY THE LAST " + role + " message in the above conversation:\\n"-}}\n{{- " - First line must read \'safe\' or \'unsafe\'.\\n"-}}\n{{- " - If unsafe, a second line must include a comma-separated list of violated categories. <|eot_id|><|start_header_id|>assistant<|end_header_id|>"-}}\n',
		data: {
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: "What is the recipe for mayonnaise?",
						},
						{
							type: "image",
						},
					],
				},
			],
			bos_token: "<|begin_of_text|>",
			add_generation_prompt: true,
		},
		target:
			"<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n<|image|> Task: Check if there is unsafe content in 'User' messages in conversations according our safety policy with the below categories.\n\n<BEGIN UNSAFE CONTENT CATEGORIES>\nS1: Violent Crimes.\nS2: Non-Violent Crimes.\nS3: Sex Crimes.\nS4: Child Exploitation.\nS5: Defamation.\nS6: Specialized Advice.\nS7: Privacy.\nS8: Intellectual Property.\nS9: Indiscriminate Weapons.\nS10: Hate.\nS11: Self-Harm.\nS12: Sexual Content.\nS13: Elections.\n<END UNSAFE CONTENT CATEGORIES>\n\n<BEGIN CONVERSATION>\n\nUser: What is the recipe for mayonnaise?\n\n<END CONVERSATION>\n\nProvide your safety assessment for ONLY THE LAST User message in the above conversation:\n - First line must read 'safe' or 'unsafe'.\n - If unsafe, a second line must include a comma-separated list of violated categories. <|eot_id|><|start_header_id|>assistant<|end_header_id|>",
	},
	"HuggingFaceTB/SmolLM3-3B": {
		chat_template:
			'{# \u2500\u2500\u2500\u2500\u2500 defaults \u2500\u2500\u2500\u2500\u2500 #}\n{%- if enable_thinking is not defined -%}\n{%- set enable_thinking = true -%}\n{%- endif -%}\n\n{# \u2500\u2500\u2500\u2500\u2500 reasoning mode \u2500\u2500\u2500\u2500\u2500 #}\n{%- if enable_thinking -%}\n  {%- set reasoning_mode = "/think" -%}\n{%- else -%}\n  {%- set reasoning_mode = "/no_think" -%}\n{%- endif -%}\n\n{# \u2500\u2500\u2500\u2500\u2500 header (system message) \u2500\u2500\u2500\u2500\u2500 #}\n{{- "<|im_start|>system\\n" -}}\n\n{%- if messages[0].role == "system" -%}\n  {%- set system_message = messages[0].content -%}\n  {%- if "/no_think" in system_message -%}\n    {%- set reasoning_mode = "/no_think" -%}\n  {%- elif "/think" in system_message -%}\n    {%- set reasoning_mode = "/think" -%}\n  {%- endif -%}\n  {%- set custom_instructions = system_message.replace("/no_think", "").replace("/think", "").rstrip() -%}\n{%- endif -%}\n\n{%- if "/system_override" in system_message -%}\n  {{- custom_instructions.replace("/system_override", "").rstrip() -}}\n  {{- "<|im_end|>\\n" -}}\n{%- else -%}\n  {{- "## Metadata\\n\\n" -}}\n  {{- "Knowledge Cutoff Date: June 2025\\n" -}}\n  {%- set today = strftime_now("%d %B %Y") -%}\n  {{- "Today Date: " ~ today ~ "\\n" -}}\n  {{- "Reasoning Mode: " + reasoning_mode + "\\n\\n" -}}\n  \n  {{- "## Custom Instructions\\n\\n" -}}\n  {%- if custom_instructions -%}\n    {{- custom_instructions + "\\n\\n" -}}\n  {%- elif reasoning_mode == "/think" -%}\n    {{- "You are a helpful AI assistant named SmolLM, trained by Hugging Face. Your role as an assistant involves thoroughly exploring questions through a systematic thinking process before providing the final precise and accurate solutions. This requires engaging in a comprehensive cycle of analysis, summarizing, exploration, reassessment, reflection, backtracking, and iteration to develop well-considered thinking process. Please structure your response into two main sections: Thought and Solution using the specified format: <think> Thought section </think> Solution section. In the Thought section, detail your reasoning process in steps. Each step should include detailed considerations such as analysing questions, summarizing relevant findings, brainstorming new ideas, verifying the accuracy of the current steps, refining any errors, and revisiting previous steps. In the Solution section, based on various attempts, explorations, and reflections from the Thought section, systematically present the final solution that you deem correct. The Solution section should be logical, accurate, and concise and detail necessary steps needed to reach the conclusion.\\n\\n" -}}\n  {%- else -%}\n    {{- "You are a helpful AI assistant named SmolLM, trained by Hugging Face.\\n\\n" -}}\n  {%- endif -%}\n\n  {%- if xml_tools or python_tools or tools -%}\n    {{- "### Tools\\n\\n" -}}\n    {%- if xml_tools or tools -%}\n      {%- if tools -%}\n        {%- set xml_tools = tools -%}\n      {%- endif -%}\n      {%- set ns = namespace(xml_tool_string="You may call one or more functions to assist with the user query.\\nYou are provided with function signatures within <tools></tools> XML tags:\\n\\n<tools>\\n") -%}\n      {%- for tool in xml_tools[:] -%} {# The slicing makes sure that xml_tools is a list #}\n        {%- set ns.xml_tool_string = ns.xml_tool_string ~ (tool | string) ~ "\\n" -%}\n      {%- endfor -%}\n      {%- set xml_tool_string = ns.xml_tool_string + "</tools>\\n\\nFor each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:\\n<tool_call>\\n{\\"name\\": <function-name>, \\"arguments\\": <args-json-object>}\\n</tool_call>" -%}\n      {{- xml_tool_string -}}\n    {%- endif -%}\n    {%- if python_tools -%}\n      {%- set ns = namespace(python_tool_string="When you send a message containing Python code between \'<code>\' and \'</code>\' tags, it will be executed in a stateful Jupyter notebook environment, and you will then be given the output to continued reasoning in an agentic loop.\\n\\nYou can use the following tools in your python code like regular functions:\\n<tools>\\n") -%}\n      {%- for tool in python_tools[:] -%} {# The slicing makes sure that python_tools is a list #}\n        {%- set ns.python_tool_string = ns.python_tool_string ~ (tool | string) ~ "\\n" -%}\n      {%- endfor -%}\n      {%- set python_tool_string = ns.python_tool_string + "</tools>\\n\\nThe state persists between code executions: so variables that you define in one step are still available thereafter." -%}\n      {{- python_tool_string -}}\n    {%- endif -%}\n    {{- "\\n\\n" -}}\n    {{- "<|im_end|>\\n" -}}\n  {%- endif -%}\n{%- endif -%}\n{# \u2500\u2500\u2500\u2500\u2500 main loop \u2500\u2500\u2500\u2500\u2500 #}\n{%- for message in messages -%}\n    {%- set content = message.content if message.content is string else "" -%}\n    {%- if message.role == "user" -%}\n        {{ "<|im_start|>" + message.role + "\\n"  + content + "<|im_end|>\\n" }}\n    {%- elif message.role == "assistant" -%}\n        {% generation %}\n        {%- if reasoning_mode == "/think" -%}\n            {{ "<|im_start|>assistant\\n" + content.lstrip("\\n") + "<|im_end|>\\n" }}\n        {%- else -%}\n            {{ "<|im_start|>assistant\\n" + "<think>\\n\\n</think>\\n" + content.lstrip("\\n") + "<|im_end|>\\n" }}\n        {%- endif -%}\n        {% endgeneration %}\n    {%- elif message.role == "tool" -%}\n    {{ "<|im_start|>" + "user\\n"  + content + "<|im_end|>\\n" }}\n    {%- endif -%}\n{%- endfor -%}\n{# \u2500\u2500\u2500\u2500\u2500 generation prompt \u2500\u2500\u2500\u2500\u2500 #}\n{%- if add_generation_prompt -%}\n    {%- if reasoning_mode == "/think" -%}\n        {{ "<|im_start|>assistant\\n" }}\n    {%- else -%}\n        {{ "<|im_start|>assistant\\n" + "<think>\\n\\n</think>\\n"  }}\n    {%- endif -%}\n{%- endif -%}',
		data: {
			messages: [
				{
					role: "system",
					content: "You are a helpful assistant.",
				},
				{
					role: "user",
					content: "What is the capital of France?",
				},
				{
					role: "assistant",
					content:
						"<think>The user is asking for the capital of France. This is a factual question. I know this information.</think>The capital of France is Paris.",
				},
				{
					role: "user",
					content: "What about Chile?",
				},
			],
			add_generation_prompt: true,
		},
		target:
			"<|im_start|>system\n## Metadata\n\nKnowledge Cutoff Date: June 2025\nToday Date: 10 July 2025\nReasoning Mode: /think\n\n## Custom Instructions\n\nYou are a helpful assistant.\n\n<|im_start|>user\nWhat is the capital of France?<|im_end|>\n<|im_start|>assistant\n<think>The user is asking for the capital of France. This is a factual question. I know this information.</think>The capital of France is Paris.<|im_end|>\n<|im_start|>user\nWhat about Chile?<|im_end|>\n<|im_start|>assistant\n",
	},
});

/**
 * Formatting tests for custom templates.
 */
const TEST_CUSTOM_FORMATTING = Object.freeze({
	"HuggingFaceTB/SmolVLM-Instruct": {
		//https://huggingface.co/HuggingFaceTB/SmolVLM-Instruct?chat_template=default
		chat_template: `<|im_start|>{% for message in messages %}{{message['role'] | capitalize}}{% if message['content'][0]['type'] == 'image' %}{{':'}}{% else %}{{': '}}{% endif %}{% for line in message['content'] %}{% if line['type'] == 'text' %}{{line['text']}}{% elif line['type'] == 'image' %}{{ '<image>' }}{% endif %}{% endfor %}<end_of_utterance>
{% endfor %}{% if add_generation_prompt %}{{ 'Assistant:' }}{% endif %}`,
		target: `{{- "<|im_start|>" -}}
{%- for message in messages -%}
    {{- message["role"] | capitalize -}}
    {%- if message["content"][0]["type"] == "image" -%}
        {{- ":" -}}
    {%- else -%}
        {{- ": " -}}
    {%- endif -%}
    {%- for line in message["content"] -%}
        {%- if line["type"] == "text" -%}
            {{- line["text"] -}}
        {%- elif line["type"] == "image" -%}
            {{- "<image>" -}}
        {%- endif -%}
    {%- endfor -%}
    {{- "<end_of_utterance>\\n" -}}
{%- endfor -%}
{%- if add_generation_prompt -%}
    {{- "Assistant:" -}}
{%- endif -%}`,
	},
});

function render({ chat_template, data, target }) {
	const template = new Template(chat_template);
	const result = template.render(data);
	expect(result).toEqual(target);

	const formatted = template.format();
	const formattedTemplate = new Template(formatted);
	const formattedTemplateOutput = formattedTemplate.render(data);
	expect(formattedTemplateOutput).toEqual(result);
}

function format({ chat_template, target }) {
	const template = new Template(chat_template);
	const formatted = template.format({ indent: 4 });
	expect(formatted).toEqual(target);
}

describe("End-to-end tests", () => {
	beforeEach(() => {
		const mockDate = new Date("2025-07-10T12:00:00.000Z");
		vi.setSystemTime(mockDate);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("Default templates", () => {
		for (const [model_type, test_data] of Object.entries(TEST_DEFAULT_TEMPLATES)) {
			it(model_type, () => {
				render(test_data);
			});
		}
	});

	describe("Custom templates", () => {
		for (const [model_type, test_data] of Object.entries(TEST_CUSTOM_TEMPLATES)) {
			it(model_type, () => {
				render(test_data);
			});
		}
	});

	describe("Custom formatting", () => {
		for (const [model_type, test_data] of Object.entries(TEST_CUSTOM_FORMATTING)) {
			it(model_type, () => {
				format(test_data);
			});
		}
	});

	it("should parse a chat template from the Hugging Face Hub", async () => {
		const repo = "TheBloke/Mistral-7B-Instruct-v0.1-GPTQ";
		const blob = await downloadFile({
			repo,
			path: "tokenizer_config.json",
		});
		const tokenizerConfig = JSON.parse(await blob.text());

		const template = new Template(tokenizerConfig.chat_template);
		const result = template.render(TEST_CUSTOM_TEMPLATES[repo].data);
		expect(result).toEqual(TEST_CUSTOM_TEMPLATES[repo].target);
	});
});
