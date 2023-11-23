/**
 * @file Templates for Chat Models
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

import { tokenize } from "./jinja/lexer";
import { parse } from "./jinja/parser";
import { Environment, Interpreter } from "./jinja/runtime";

export class Template {
	// trim_blocks=True, lstrip_blocks=True
	/**
	 *
	 * @param {string} template The template string
	 */
	constructor(template) {
		const tokens = tokenize(template);
		this.parsed = parse(tokens);
	}

	/**
	 *
	 * @param {Object} items
	 *
	 * @returns {string}
	 */
	render(items) {
		// Create a new environment for this template
		const env = new Environment();

		// Declare global variables
		env.set("false", false);
		env.set("true", true);
		env.set("raise_exception", (args, scope) => {
			throw new Error(args);
		});

		// Add user-defined variables
		for (const [key, value] of Object.entries(items)) {
			env.set(key, value);
		}

		const interpreter = new Interpreter(env);

		const result = interpreter.run(this.parsed);
		return result.value;
	}
}
