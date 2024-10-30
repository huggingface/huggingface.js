import type { ChatCompletionInputMessage, GenerationParameters } from "../tasks";

export function stringifyMessages(
	messages: ChatCompletionInputMessage[],
	opts?: {
		indent?: string;
		attributeKeyQuotes?: boolean;
		customContentEscaper?: (str: string) => string;
	}
): string {
	let messagesStr = JSON.stringify(messages, null, "\t");
	if (opts?.indent) {
		messagesStr = messagesStr.replaceAll("\n", `\n${opts.indent}`);
	}
	if (!opts?.attributeKeyQuotes) {
		messagesStr = messagesStr.replace(/"([^"]+)":/g, "$1:");
	}
	if (opts?.customContentEscaper) {
		messagesStr = opts.customContentEscaper(messagesStr);
	}
	return messagesStr;
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
