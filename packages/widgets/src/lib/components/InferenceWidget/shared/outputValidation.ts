import type {
	WidgetExampleOutputLabels,
	WidgetExampleOutputAnswerScore,
	WidgetExampleOutputText,
	WidgetExampleOutputUrl,
} from "./WidgetExample";

export function isValidOutputLabels(arg: unknown): arg is WidgetExampleOutputLabels {
	return Array.isArray(arg) && arg.every((x) => typeof x.label === "string" && typeof x.score === "number");
}

export function isValidOutputAnswerScore(arg: unknown): arg is WidgetExampleOutputAnswerScore {
	return !!arg && typeof arg === "object" && typeof arg["answer"] === "string" && typeof arg["score"] === "number";
}

export function isValidOutputText(arg: unknown): arg is WidgetExampleOutputText {
	return !!arg && typeof arg === "object" && typeof arg["text"] === "string";
}

export function isValidOutputUrl(arg: unknown): arg is WidgetExampleOutputUrl {
	return !!arg && typeof arg === "object" && typeof arg["url"] === "string" && arg["url"].startsWith("https://");
}
