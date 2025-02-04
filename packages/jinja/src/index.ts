/**
 * @file Jinja templating engine
 *
 * A minimalistic JavaScript reimplementation of the [Jinja](https://github.com/pallets/jinja) templating engine,
 * to support the chat templates. Special thanks to [Tyler Laceby](https://github.com/tlaceby) for his amazing
 * ["Guide to Interpreters"](https://github.com/tlaceby/guide-to-interpreters-series) tutorial series,
 * which provided the basis for this implementation.
 *
 * See the [Transformers documentation](https://huggingface.co/docs/transformers/main/en/chat_templating) for more information.
 *
 * @module index
 */
import { tokenize } from "./lexer";
import { parse } from "./parser";
import { Environment, Interpreter } from "./runtime";
import type { Program } from "./ast";
import type { StringValue } from "./runtime";
import { range } from "./utils";

export class Template {
	parsed: Program;

	/**
	 * @param {string} template The template string
	 */
	constructor(template: string) {
		const tokens = tokenize(template, {
			lstrip_blocks: true,
			trim_blocks: true,
		});
		this.parsed = parse(tokens);
	}

	render(items?: Record<string, unknown>): string {
		// Create a new environment for this template
		const env = new Environment();

		// Declare global variables
		env.set("false", false);
		env.set("true", true);
		env.set("raise_exception", (args: string) => {
			throw new Error(args);
		});
		env.set("range", range);

		// Add user-defined variables
		if (items) {
			for (const [key, value] of Object.entries(items)) {
				env.set(key, value);
			}
		}

		const interpreter = new Interpreter(env);

		const result = interpreter.run(this.parsed) as StringValue;
		return result.value;
	}
}

export { Environment, Interpreter, tokenize, parse };
