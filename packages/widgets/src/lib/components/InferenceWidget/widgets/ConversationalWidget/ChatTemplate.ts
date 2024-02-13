import type { SpecialTokensMap, TokenizerConfig } from "@huggingface/tasks";
import {SPECIAL_TOKENS_ATTRIBUTES } from "@huggingface/tasks";

// This template formats inputs in the standard ChatML format. See https://github.com/openai/openai-python/blob/main/chatml.md
const DEFAULT_CHAT_TEMPLATE =
	"{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}";

const DEFAULT_BLENDERBOT_CHAT_TEMPLATE =
	"{% for message in messages %}{% if message['role'] == 'user' %}{{ ' ' }}{% endif %}{{ message['content'] }}{% if not loop.last %}{{ '  ' }}{% endif %}{% endfor %}{{ eos_token }}";

const DEFAULT_LLAMA_CHAT_TEMPLATE =
	"{% if messages[0]['role'] == 'system' %}{% set loop_messages = messages[1:] %}{% set system_message = messages[0]['content'] %}{% elif USE_DEFAULT_PROMPT == true and not '<<SYS>>' in messages[0]['content'] %}{% set loop_messages = messages %}{% set system_message = 'DEFAULT_SYSTEM_MESSAGE' %}{% else %}{% set loop_messages = messages %}{% set system_message = false %}{% endif %}{% for message in loop_messages %}{% if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}{{ raise_exception('Conversation roles must alternate user/assistant/user/assistant/...') }}{% endif %}{% if loop.index0 == 0 and system_message != false %}{% set content = '<<SYS>>\\n' + system_message + '\\n<</SYS>>\\n\\n' + message['content'] %}{% else %}{% set content = message['content'] %}{% endif %}{% if message['role'] == 'user' %}{{ bos_token + '[INST] ' + content.strip() + ' [/INST]' }}{% elif message['role'] == 'system' %}{{ '<<SYS>>\\n' + content.strip() + '\\n<</SYS>>\\n\\n' }}{% elif message['role'] == 'assistant' %}{{ ' '  + content.strip() + ' ' + eos_token }}{% endif %}{% endfor %}";

const DEFAULT_GPT2_CHAT_TEMPLATE = "{% for message in messages %}{{ message.content }}{{ eos_token }}{% endfor %}";

// The mapping of default chat templates defined in http://github.com/huggingface/transformers
const DEFAULT_CHAT_TEMPLATES: Map<string, string> = new Map([
	// Blenderbot-like chat templates
	["blenderbot", DEFAULT_BLENDERBOT_CHAT_TEMPLATE],
	["blenderbot_small", DEFAULT_BLENDERBOT_CHAT_TEMPLATE],

	// GPT2-like chat templates
	["gpt_neox", DEFAULT_GPT2_CHAT_TEMPLATE],
	["gpt2", DEFAULT_GPT2_CHAT_TEMPLATE],
	["whisper", DEFAULT_GPT2_CHAT_TEMPLATE],
	["bloom", DEFAULT_GPT2_CHAT_TEMPLATE],

	// Llama-like chat templates
	["llama", DEFAULT_LLAMA_CHAT_TEMPLATE],
	["code_llama", DEFAULT_LLAMA_CHAT_TEMPLATE],

	// Others
	[
		"gptsan_japanese",
		"{% for message in messages %}{% if not loop.first %}{{ bos_token}}{% endif %}{{ sep_token }}{{ message.content }} {{ eos_token }}{% endfor %}",
	],
	[
		"gpt_neox_japanese",
		"{% for message in messages %}{{ bos_token + eos_token + message.content + eos_token }}{% endfor %}{% if add_generation_prompt %} {{ bos_token + eos_token }} {% endif %}",
	],
]);

const LLAMA_DEFAULT_SYSTEM_PROMPT = `You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe. Your 
answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure 
that your responses are socially unbiased and positive in nature.

If a question does not make any sense, or is not factually coherent, explain why instead of answering something not 
correct. If you don't know the answer to a question, please don't share false information.`;

// TODO: Define cache to reuse compiled Jinja templates
export function getChatTemplate(modelType: string, tokenizerConfig: TokenizerConfig): string {
	let template = DEFAULT_CHAT_TEMPLATES.get(modelType) ?? DEFAULT_CHAT_TEMPLATE;

	if (modelType === "llama") {
		const use_default_system_prompt = tokenizerConfig.use_default_system_prompt ?? false;
		template = template.replaceAll("USE_DEFAULT_PROMPT", use_default_system_prompt ? "true" : "false");
		const default_message = LLAMA_DEFAULT_SYSTEM_PROMPT.replace("\n", "\\n").replace("'", "\\'");
		template = template.replaceAll("DEFAULT_SYSTEM_MESSAGE", default_message);
	}

	return template;
}

export function extractSpecialTokensMap(tokenizerConfig: TokenizerConfig): SpecialTokensMap {
	const specialTokensMap = Object.create(null);
	for (const key of SPECIAL_TOKENS_ATTRIBUTES) {
		const value = tokenizerConfig[key];
		if (typeof value === "string") {
			specialTokensMap[key] = value;
		}
	}
	return specialTokensMap;
}
