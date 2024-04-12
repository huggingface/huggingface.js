import type {
	ChatMessage,
	WidgetExampleAssetAndPromptInput,
	WidgetExampleAssetAndTextInput,
	WidgetExampleAssetAndZeroShotInput,
	WidgetExampleAssetInput,
	WidgetExampleChatInput,
	WidgetExampleSentenceSimilarityInput,
	WidgetExampleStructuredDataInput,
	WidgetExampleTableDataInput,
	WidgetExampleTextAndContextInput,
	WidgetExampleTextAndTableInput,
	WidgetExampleTextInput,
	WidgetExampleZeroShotTextInput,
} from "@huggingface/tasks";

export function isObject(arg: unknown): arg is Record<string, unknown> {
	return !!arg && arg?.constructor === Object;
}
function isStrArray(arg: unknown): arg is string[] {
	return Array.isArray(arg) && arg.every((v) => typeof v === "string");
}

export function isTextInput<TOutput>(sample: unknown): sample is WidgetExampleTextInput<TOutput> {
	return isObject(sample) && "text" in sample && typeof sample.text === "string";
}

export function isTextAndContextInput<TOutput>(sample: unknown): sample is WidgetExampleTextAndContextInput<TOutput> {
	return isTextInput(sample) && "context" in sample;
}

export function isAssetInput<TOutput>(sample: unknown): sample is WidgetExampleAssetInput<TOutput> {
	return isObject(sample) && "src" in sample && typeof sample.src === "string";
}

export function isAssetAndPromptInput<TOutput>(sample: unknown): sample is WidgetExampleAssetAndPromptInput<TOutput> {
	return isAssetInput(sample) && "prompt" in sample && typeof sample.prompt === "string";
}

export function isAssetAndTextInput<TOutput>(sample: unknown): sample is WidgetExampleAssetAndTextInput<TOutput> {
	return isAssetInput(sample) && isTextInput(sample);
}

export function isStructuredDataInput<TOutput>(sample: unknown): sample is WidgetExampleStructuredDataInput<TOutput> {
	/// TODO: check the values' type in sample.structured_data
	return (
		isObject(sample) &&
		"structured_data" in sample &&
		isObject(sample.structured_data) &&
		Object.values(sample.structured_data).every((val) => typeof val === "number" || typeof val === "string")
	);
}

export function isTableDataInput<TOutput>(sample: unknown): sample is WidgetExampleTableDataInput<TOutput> {
	return isObject(sample) && "table" in sample;
}

function _isZeroShotTextInput<TOutput>(
	sample: unknown
): sample is Exclude<WidgetExampleZeroShotTextInput<TOutput>, "text"> {
	return (
		isObject(sample) &&
		"candidate_labels" in sample &&
		typeof sample.candidate_labels === "string" &&
		"multi_class" in sample &&
		typeof sample.multi_class === "boolean"
	);
}

export function isZeroShotTextInput<TOutput>(sample: unknown): sample is WidgetExampleZeroShotTextInput<TOutput> {
	return isTextInput(sample) && _isZeroShotTextInput(sample);
}

export function isSentenceSimilarityInput<TOutput>(
	sample: unknown
): sample is WidgetExampleSentenceSimilarityInput<TOutput> {
	return (
		isObject(sample) &&
		"source_sentence" in sample &&
		typeof sample.candidate_labels === "string" &&
		"sentences" in sample &&
		isStrArray(sample.sentences)
	);
}

export function isTextAndTableInput<TOutput>(sample: unknown): sample is WidgetExampleTextAndTableInput<TOutput> {
	return (
		isTextInput(sample) &&
		"table" in sample &&
		Array.isArray(sample.table) &&
		sample.table.every((r) => Array.isArray(r) && r.every((c) => typeof c === "string" || typeof c === "number"))
	);
}

export function isAssetAndZeroShotInput<TOutput>(
	sample: unknown
): sample is WidgetExampleAssetAndZeroShotInput<TOutput> {
	return isAssetInput(sample) && _isZeroShotTextInput(sample);
}

export function isChatInput<TOutput>(sample: unknown): sample is WidgetExampleChatInput<TOutput> {
	return (
		isObject(sample) &&
		"messages" in sample &&
		Array.isArray(sample.messages) &&
		sample.messages.every(
			(message): message is ChatMessage =>
				isObject(message) &&
				"role" in message &&
				"content" in message &&
				typeof message.role === "string" &&
				["user", "system", "assistant"].includes(message.role) &&
				typeof message.content === "string"
		)
	);
}
