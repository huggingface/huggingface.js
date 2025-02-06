export interface OllamaCustomMappedTemplate {
	ollamaTmpl: string;
	stop?: string;
}

export interface GGUFParsedInfo {
	chat_template: string;
	bos_token?: string;
	eos_token?: string;
}

export interface OllamaChatTemplateMapEntry {
	model: string;
	gguf: string;
	ollama: {
		template: string;
		tokens: string[];
		params?: {
			stop?: string[];
			// eslint-disable-next-line
			[key: string]: any;
		};
	};
}
