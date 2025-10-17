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
import { Environment, Interpreter, setupGlobals } from "./runtime";
import type { Program } from "./ast";
import { StringValue } from "./runtime";
import { format } from "./format";

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
		const { result } = this.execute(items);
		return result.value;
	}

	missingVariables(items?: Record<string, unknown>): string[] {
		const { interpreter } = this.execute(items, { suppressRuntimeErrors: true });
		return interpreter.getMissingVariables();
	}

	format(options?: { indent: string | number }): string {
		return format(this.parsed, options?.indent || "\t");
	}

	private execute(
		items?: Record<string, unknown>,
		options?: { suppressRuntimeErrors?: boolean }
	): { result: StringValue; interpreter: Interpreter } {
		const env = new Environment();
		setupGlobals(env);

		if (items) {
			for (const [key, value] of Object.entries(items)) {
				env.set(key, value);
			}
		}

		const interpreter = new Interpreter(env);
		let result: StringValue;
		try {
			result = interpreter.run(this.parsed) as StringValue;
		} catch (error) {
			if (!options?.suppressRuntimeErrors) {
				throw error;
			}
			result = new StringValue("");
		}
		return { result, interpreter };
	}
}

export { Environment, Interpreter, tokenize, parse };
