import { describe, expect, it } from "vitest";

import { Template } from "../src/index";

import { downloadFile } from "../../hub";

const EXAMPLE_CHAT = [
	{ role: "user", content: "Hello, how are you?" },
	{ role: "assistant", content: "I'm doing great. How can I help you today?" },
	{ role: "user", content: "I'd like to show off how chat templating works!" },
];

// const EXAMPLE_CHAT_WITH_SYTEM = [
// 	{
// 		role: "system",
// 		content: "You are a friendly chatbot who always responds in the style of a pirate",
// 	},
// 	...EXAMPLE_CHAT,
// ];

/**
 * Defined in https://github.com/huggingface/transformers
 * Keys correspond to `model_type` in the transformers repo.
 */
const TEST_DEFAULT_TEMPLATES = Object.freeze({
	_base: {
		data: {
			messages: EXAMPLE_CHAT,
			add_generation_prompt: false,
		},
		chat_template: `{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}`,
		target: `<|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\nI'm doing great. How can I help you today?<|im_end|>\n<|im_start|>user\nI'd like to show off how chat templating works!<|im_end|>\n`,
	},
	blenderbot: {
		// facebook/blenderbot-400M-distill
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "</s>",
		},
		chat_template: `{% for message in messages %}{% if message['role'] == 'user' %}{{ ' ' }}{% endif %}{{ message['content'] }}{% if not loop.last %}{{ '  ' }}{% endif %}{% endfor %}{{ eos_token }}`,
		target: ` Hello, how are you?  I'm doing great. How can I help you today?   I'd like to show off how chat templating works!</s>`,
	},
	blenderbot_small: {
		// facebook/blenderbot_small-90M
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "</s>",
		},
		chat_template: `{% for message in messages %}{% if message['role'] == 'user' %}{{ ' ' }}{% endif %}{{ message['content'] }}{% if not loop.last %}{{ '  ' }}{% endif %}{% endfor %}{{ eos_token }}`,
		target: ` Hello, how are you?  I'm doing great. How can I help you today?   I'd like to show off how chat templating works!</s>`,
	},
	bloom: {
		// bigscience/bloom
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "</s>",
		},
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		target: `Hello, how are you?</s>I'm doing great. How can I help you today?</s>I'd like to show off how chat templating works!</s>`,
	},
	gpt_neox: {
		// EleutherAI/gpt-neox-20b
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "<|endoftext|>",
		},
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		target: `Hello, how are you?<|endoftext|>I'm doing great. How can I help you today?<|endoftext|>I'd like to show off how chat templating works!<|endoftext|>`,
	},
	gpt2: {
		// gpt2
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "<|endoftext|>",
		},
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		target: `Hello, how are you?<|endoftext|>I'm doing great. How can I help you today?<|endoftext|>I'd like to show off how chat templating works!<|endoftext|>`,
	},
	// llama: { // hf-internal-testing/llama-tokenizer
	//     data: {
	//         messages: EXAMPLE_CHAT_WITH_SYTEM,
	//         bos_token: "<s>",
	//         eos_token: "</s>",
	//         USE_DEFAULT_PROMPT: true,
	//     },
	//     chat_template: `{% if messages[0]['role'] == 'system' %}{% set loop_messages = messages[1:] %}{% set system_message = messages[0]['content'] %}{% elif USE_DEFAULT_PROMPT == true and not '<<SYS>>' in messages[0]['content'] %}{% set loop_messages = messages %}{% set system_message = 'DEFAULT_SYSTEM_MESSAGE' %}{% else %}{% set loop_messages = messages %}{% set system_message = false %}{% endif %}{% for message in loop_messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if loop.index0 == 0 and system_message != false %}{% set content = '<<SYS>>\\n' + system_message + '\\n<</SYS>>\\n\\n' + message['content'] %}{% else %}{% set content = message['content'] %}{% endif %}{% if message['role'] == 'user' %}{{ bos_token + '[INST] ' + content.strip() + ' [/INST]' }}{% elif message['role'] == 'system' %}{{ '<<SYS>>\\n' + content.strip() + '\\n<</SYS>>\\n\\n' }}{% elif message['role'] == 'assistant' %}{{ ' ' + content.strip() + ' ' + eos_token }}{% endif %}{% endfor %}`,
	//     target: `<s>[INST] <<SYS>>\nYou are a friendly chatbot who always responds in the style of a pirate\n<</SYS>>\n\nHello, how are you? [/INST] I'm doing great. How can I help you today? </s><s>[INST] I'd like to show off how chat templating works! [/INST]`,
	// },
	whisper: {
		// openai/whisper-large-v3
		data: {
			messages: EXAMPLE_CHAT,
			eos_token: "<|endoftext|>",
		},
		chat_template: `{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}`,
		target: `Hello, how are you?<|endoftext|>I'm doing great. How can I help you today?<|endoftext|>I'd like to show off how chat templating works!<|endoftext|>`,
	},
});

/**
 * Custom templates that are not defined in the transformers repo.
 * Keys are repo ids on the Hugging Face Hub (https://hf.co/models)
 */
const TEST_CUSTOM_TEMPLATES = Object.freeze({
	// 'HuggingFaceH4/zephyr-7b-beta': {
	//     data: {
	//         messages: EXAMPLE_CHAT_WITH_SYTEM,
	//         eos_token: "</s>",
	//         add_generation_prompt: false,
	//     },
	//     chat_template: `{% for message in messages %}\n{% if message['role'] == 'user' %}\n{{ '<|user|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'system' %}\n{{ '<|system|>\n' + message['content'] + eos_token }}\n{% elif message['role'] == 'assistant' %}\n{{ '<|assistant|>\n'  + message['content'] + eos_token }}\n{% endif %}\n{% if loop.last and add_generation_prompt %}\n{{ '<|assistant|>' }}\n{% endif %}\n{% endfor %}`,
	//     target: `<|system|>\nYou are a friendly chatbot who always responds in the style of a pirate</s>\n<|user|>\nHello, how are you?</s>\n<|assistant|>\nI'm doing great. How can I help you today?</s>\n<|user|>\nI'd like to show off how chat templating works!</s>\n`,
	// },
	"mistralai/Mistral-7B-Instruct-v0.1": {
		data: {
			messages: EXAMPLE_CHAT,
			bos_token: "<s>",
			eos_token: "</s>",
		},
		chat_template: `{{ bos_token }}{% for message in messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if message['role'] == 'user' %}{{ '[INST] ' + message['content'] + ' [/INST]' }}{% elif message['role'] == 'assistant' %}{{ message['content'] + eos_token + ' ' }}{% else %}{{ raise_exception('Only user and assistant roles are supported!') }}{% endif %}{% endfor %}`,
		target: `<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] I'd like to show off how chat templating works! [/INST]`,
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
		const repo = "mistralai/Mistral-7B-Instruct-v0.1";
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
