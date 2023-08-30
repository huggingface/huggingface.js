import Handlebars from "handlebars";
import type { Template, Message } from "../types";

Handlebars.registerHelper("ifUser", function (this: Pick<Message, "from" | "content">, options) {
	if (this.from == "user") return options.fn(this);
});

Handlebars.registerHelper("ifAssistant", function (this: Pick<Message, "from" | "content">, options) {
	if (this.from == "assistant") return options.fn(this);
});

export function compileTemplate<T>(input: string): Template<T> {
	const template = Handlebars.compile<T>(input, {
		knownHelpers: { ifUser: true, ifAssistant: true },
		knownHelpersOnly: true,
		noEscape: true,
		strict: true,
		preventIndent: true,
	});

	return function render(inputs: T, options?: RuntimeOptions) {
		return template({ ...inputs }, options);
	};
}
