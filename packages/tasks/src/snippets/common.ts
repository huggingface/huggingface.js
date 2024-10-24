import type { ChatCompletionInputMessage, GenerationParameters } from "../tasks";

export interface StringifyMessagesOptions {
	sep: string;
	start: string;
	end: string;
	attributeKeyQuotes?: boolean;
	customContentEscaper?: (str: string) => string;
}

export function stringifyMessages(messages: ChatCompletionInputMessage[], opts: StringifyMessagesOptions): string {
	const keyRole = opts.attributeKeyQuotes ? `"role"` : "role";
	const keyContent = opts.attributeKeyQuotes ? `"content"` : "content";

	const messagesStringified = messages.map(({ role, content }) => {
		if (typeof content === "string") {
			content = JSON.stringify(content).slice(1, -1);
			if (opts.customContentEscaper) {
				content = opts.customContentEscaper(content);
			}
			return `{ ${keyRole}: "${role}", ${keyContent}: "${content}" }`;
		} else {
			2;
			content = content.map(({ image_url, text, type }) => ({
				type,
				image_url,
				...(text ? { text: JSON.stringify(text).slice(1, -1) } : undefined),
			}));
			content = JSON.stringify(content).slice(1, -1);
			if (opts.customContentEscaper) {
				content = opts.customContentEscaper(content);
			}
			return `{ ${keyRole}: "${role}", ${keyContent}: ${content} }`;
		}
	});

	return opts.start + messagesStringified.join(opts.sep) + opts.end;
}

type PartialGenerationParameters = Partial<Pick<GenerationParameters, "temperature" | "max_tokens" | "top_p">>;

export interface StringifyGenerationConfigOptions {
	sep: string;
	start: string;
	end: string;
	attributeValueConnector: string;
	attributeKeyQuotes?: boolean;
}

export function stringifyGenerationConfig(
	config: PartialGenerationParameters,
	opts: StringifyGenerationConfigOptions
): string {
	const quote = opts.attributeKeyQuotes ? `"` : "";

	return (
		opts.start +
		Object.entries(config)
			.map(([key, val]) => `${quote}${key}${quote}${opts.attributeValueConnector}${val}`)
			.join(opts.sep) +
		opts.end
	);
}
