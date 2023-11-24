import type {
	WidgetExample,
	WidgetExampleAssetAndPromptInput,
	WidgetExampleAssetAndTextInput,
	WidgetExampleAssetAndZeroShotInput,
	WidgetExampleAssetInput,
	WidgetExampleSentenceSimilarityInput,
	WidgetExampleStructuredDataInput,
	WidgetExampleTableDataInput,
	WidgetExampleTextAndContextInput,
	WidgetExampleTextAndTableInput,
	WidgetExampleTextInput,
	WidgetExampleZeroShotTextInput,
} from "@huggingface/tasks";

export function isTextInput<TOutput>(sample: WidgetExample<TOutput>): sample is WidgetExampleTextInput<TOutput> {
	return "text" in sample;
}

export function isTextAndContextInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is WidgetExampleTextAndContextInput<TOutput> {
	return isTextInput(sample) && "context" in sample;
}

export function isAssetInput<TOutput>(sample: WidgetExample<TOutput>): sample is WidgetExampleAssetInput<TOutput> {
	return "src" in sample;
}

export function isAssetAndPromptInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is WidgetExampleAssetAndPromptInput<TOutput> {
	return isAssetInput(sample) && "prompt" in sample && typeof sample.prompt === "string";
}

export function isAssetAndTextInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is WidgetExampleAssetAndTextInput<TOutput> {
	return isAssetInput(sample) && isTextInput(sample);
}

export function isStructuredDataInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is WidgetExampleStructuredDataInput<TOutput> {
	return "structured_data" in sample;
}

export function isTableDataInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is WidgetExampleTableDataInput<TOutput> {
	return "table" in sample;
}

function _isZeroShotTextInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is Exclude<WidgetExampleZeroShotTextInput<TOutput>, "text"> {
	return "candidate_labels" in sample && "multi_class" in sample;
}

export function isZeroShotTextInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is WidgetExampleZeroShotTextInput<TOutput> {
	return isTextInput(sample) && _isZeroShotTextInput(sample);
}

export function isSentenceSimilarityInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is WidgetExampleSentenceSimilarityInput<TOutput> {
	return "source_sentence" in sample && "sentences" in sample;
}

export function isTextAndTableInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is WidgetExampleTextAndTableInput<TOutput> {
	return (
		isTextInput(sample) &&
		"table" in sample &&
		Array.isArray(sample.table) &&
		sample.table.every((r) => Array.isArray(r) && r.every((c) => typeof c === "string" || typeof c === "number"))
	);
}

export function isAssetAndZeroShotInput<TOutput>(
	sample: WidgetExample<TOutput>
): sample is WidgetExampleAssetAndZeroShotInput<TOutput> {
	return isAssetInput(sample) && _isZeroShotTextInput(sample);
}
