import type { ModelDataMinimal } from "../types";
import type { TokenizerConfig } from "../../tokenizer-data";

import { Template } from "@huggingface/jinja";
import { SPECIAL_TOKENS_ATTRIBUTES } from "../../tokenizer-data";

// Define default text generation input
const DEFAULT_TEXT_GENERATION_INPUT = `"Can you please let us know more details about your "`;

// Define defaults for chat models
const DEFAULT_SYSTEM_MESSAGE = { role: "system", content: "You are a helpful assistant." };
const DEFAULT_USER_MESSAGE = { role: "user", content: "Tell me a joke." };
const DEFAULT_MESSAGES = [DEFAULT_SYSTEM_MESSAGE, DEFAULT_USER_MESSAGE];

type SpecialTokensMap = Partial<Record<(typeof SPECIAL_TOKENS_ATTRIBUTES)[number], string>>;
const getSpecialTokensMap = (tokenizerConfig: TokenizerConfig): SpecialTokensMap => {
	const specialTokensMap: SpecialTokensMap = {};
	for (const token of SPECIAL_TOKENS_ATTRIBUTES) {
		const item = tokenizerConfig[token];
		if (typeof item === "string") {
			specialTokensMap[token] = item;
		} else if (item?.content) {
			specialTokensMap[token] = item.content;
		}
	}
	return specialTokensMap;
};

export default (model: ModelDataMinimal): string => {
	const tokenizerConfig = model.config?.tokenizer_config;
	if (!tokenizerConfig) {
		return DEFAULT_TEXT_GENERATION_INPUT;
	}

	let chat_template = tokenizerConfig.chat_template;
	if (Array.isArray(chat_template)) {
		// Find the default template
		chat_template = chat_template.find((template) => template?.name === "default")?.template;

		// TODO: If no default template is found, use the first one
		// However, many of these (e.g., https://huggingface.co/CohereForAI/c4ai-command-r-v01/blob/main/tokenizer_config.json)
		// have non-default templates that require additional information (e.g., tools or documents)
	}

	if (!chat_template) {
		// Default text generation input
		return DEFAULT_TEXT_GENERATION_INPUT;
	}

	try {
		const template = new Template(chat_template);
		const rendered = template.render({
			messages: DEFAULT_MESSAGES,
			// TODO: add default tools or documents

			// Add special tokens
			...getSpecialTokensMap(tokenizerConfig),
		});
		return rendered;
	} catch (e) {
		// Some error occurred, so we just return default
		return DEFAULT_TEXT_GENERATION_INPUT;
	}
};
