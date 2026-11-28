import { describe, it, expect } from "vitest";

import { Environment, Interpreter } from "../src/runtime";
import { tokenize } from "../src/lexer";
import { parse } from "../src/parser";
import { Template } from "../src/index";

describe("Test interpreter options", () => {
	// https://jinja.palletsprojects.com/en/3.0.x/templates/#whitespace-control
	it("should handle whitespace control", () => {
		const EXAMPLE_IF_TEMPLATE = `<div>\n    {% if True %}\n        yay\n    {% endif %}\n</div>`;
		const EXAMPLE_FOR_TEMPLATE = `{% for item in seq %}\n    {{ item }}\n{% endfor %}`;
		const EXAMPLE_FOR_TEMPLATE_2 = `{% for item in seq -%}\n    {{ item }}\n{% endfor %}`;
		const EXAMPLE_FOR_TEMPLATE_3 = `{% for item in seq %}\n    {{ item }}\n{%- endfor %}`;
		const EXAMPLE_FOR_TEMPLATE_4 = `{% for item in seq -%}\n    {{ item }}\n{%- endfor %}`;
		const EXAMPLE_COMMENT_TEMPLATE = `    {# comment #}\n  {# {% if true %} {% endif %} #}\n`;

		const seq = [1, 2, 3, 4, 5, 6, 7, 8, 9];

		const TESTS = [
			// If tests
			{
				template: EXAMPLE_IF_TEMPLATE,
				data: {},
				options: {},
				target: `<div>\n    \n        yay\n    \n</div>`,
			},
			{
				template: EXAMPLE_IF_TEMPLATE,
				data: {},
				options: {
					lstrip_blocks: true,
				},
				target: `<div>\n\n        yay\n\n</div>`,
			},
			{
				template: EXAMPLE_IF_TEMPLATE,
				data: {},
				options: {
					trim_blocks: true,
				},
				target: `<div>\n            yay\n    </div>`,
			},
			{
				template: EXAMPLE_IF_TEMPLATE,
				data: {},
				options: {
					lstrip_blocks: true,
					trim_blocks: true,
				},
				target: `<div>\n        yay\n</div>`,
			},

			// For tests
			{
				template: EXAMPLE_FOR_TEMPLATE,
				data: { seq },
				options: {},
				target: `\n    1\n\n    2\n\n    3\n\n    4\n\n    5\n\n    6\n\n    7\n\n    8\n\n    9\n`,
			},
			{
				template: EXAMPLE_FOR_TEMPLATE,
				data: { seq },
				options: { lstrip_blocks: true },
				target: `\n    1\n\n    2\n\n    3\n\n    4\n\n    5\n\n    6\n\n    7\n\n    8\n\n    9\n`,
			},
			{
				template: EXAMPLE_FOR_TEMPLATE,
				data: { seq },
				options: { trim_blocks: true },
				target: `    1\n    2\n    3\n    4\n    5\n    6\n    7\n    8\n    9\n`,
			},
			{
				template: EXAMPLE_FOR_TEMPLATE,
				data: { seq },
				options: { lstrip_blocks: true, trim_blocks: true },
				target: `    1\n    2\n    3\n    4\n    5\n    6\n    7\n    8\n    9\n`,
			},
			{
				template: EXAMPLE_FOR_TEMPLATE_2,
				data: { seq },
				options: {},
				target: `1\n2\n3\n4\n5\n6\n7\n8\n9\n`,
			},
			{
				template: EXAMPLE_FOR_TEMPLATE_3,
				data: { seq },
				options: {},
				target: `\n    1\n    2\n    3\n    4\n    5\n    6\n    7\n    8\n    9`,
			},
			{
				template: EXAMPLE_FOR_TEMPLATE_3,
				data: { seq },
				options: { trim_blocks: true },
				target: `    1    2    3    4    5    6    7    8    9`,
			},
			{
				template: EXAMPLE_FOR_TEMPLATE_4,
				data: { seq },
				options: {},
				target: `123456789`,
			},

			// Comment tests
			{
				template: EXAMPLE_COMMENT_TEMPLATE,
				data: {},
				options: {},
				target: `    \n  `,
			},
			{
				template: EXAMPLE_COMMENT_TEMPLATE,
				data: {},
				options: { lstrip_blocks: true },
				target: `\n`,
			},
			{
				template: EXAMPLE_COMMENT_TEMPLATE,
				data: {},
				options: { trim_blocks: true },
				target: `      `,
			},
			{
				template: EXAMPLE_COMMENT_TEMPLATE,
				data: {},
				options: { lstrip_blocks: true, trim_blocks: true },
				target: ``,
			},
		];

		for (const test of TESTS) {
			const env = new Environment();
			env.set("True", true);
			for (const [key, value] of Object.entries(test.data)) {
				env.set(key, value);
			}

			const tokens = tokenize(test.template, test.options);
			const parsed = parse(tokens);

			const interpreter = new Interpreter(env);
			const result = interpreter.run(parsed);
			expect(result.value).toEqual(test.target);
		}
	});
});

describe("Environment lookup", () => {
	it("resolves the nearest binding and observes later assignments", () => {
		const parent = new Environment();
		const inherited = parent.set("name", "parent");
		const child = new Environment(parent);
		expect(child.lookupVariable("name")).toBe(inherited);

		const local = child.set("name", "child");
		expect(child.lookupVariable("name")).toBe(local);
		child.setVariable("name", inherited);
		expect(child.lookupVariable("name")).toBe(inherited);
	});

	it("preserves explicit undefined and none while keeping missing values independent", () => {
		const parent = new Environment();
		parent.set("name", "parent");
		const child = new Environment(parent);
		const explicit = child.set("name", undefined);
		const none = child.set("empty", null);
		expect(child.lookupVariable("name")).toBe(explicit);
		expect(explicit.type).toBe("UndefinedValue");
		expect(child.lookupVariable("empty")).toBe(none);
		expect(none.type).toBe("NullValue");

		const first = child.lookupVariable("missing");
		const second = child.lookupVariable("missing");
		expect(first).not.toBe(second);
		first.value = "changed";
		expect(second.value).toBeUndefined();
		expect(child.lookupVariable("missing").value).toBeUndefined();
	});

	it("preserves dispatch through existing JavaScript resolver overrides", () => {
		const target = new Environment();
		const expected = target.set("name", "value");
		const parent = new Environment();
		const calls = [];
		// The emitted JavaScript method can be overridden despite its private TS declaration.
		parent.resolve = function (name) {
			calls.push([name, this === parent]);
			return target;
		};
		const child = new Environment(parent);
		expect(child.lookupVariable("name")).toBe(expected);
		expect(calls).toEqual([["name", true]]);
	});

	it("continues to handle unexpected errors while resolving a parent", () => {
		const child = new Environment();
		Object.defineProperty(child, "parent", {
			get() {
				throw new Error("Parent lookup failed");
			},
		});
		expect(child.lookupVariable("missing").type).toBe("UndefinedValue");
	});
});

describe("String builtins: startswith and endswith with start and end arguments", () => {
	it("supports optional start argument in startswith", () => {
		expect(new Template("{{ 'abc'.startswith('b', 1) }}").render()).toBe("true");
		expect(new Template("{{ 'abc'.startswith('a', 1) }}").render()).toBe("false");
		expect(new Template("{% if 'abc'.startswith('b', 1) %}yes{% else %}no{% endif %}").render()).toBe("yes");
	});

	it("supports optional end argument in startswith", () => {
		expect(new Template("{{ 'abcdef'.startswith('c', 2, 4) }}").render()).toBe("true");
		expect(new Template("{{ 'abcdef'.startswith('d', 2, 4) }}").render()).toBe("false");
		expect(new Template("{{ 'abcdef'.startswith('c', 2, 2) }}").render()).toBe("false");
		expect(new Template("{{ 'abcdef'.startswith('', 2, 2) }}").render()).toBe("true");
		expect(new Template("{{ 'abcdef'.startswith('c', 3, 2) }}").render()).toBe("false");
	});

	it("supports negative indexing in startswith", () => {
		expect(new Template("{{ 'abcdef'.startswith('e', -2) }}").render()).toBe("true");
		expect(new Template("{{ 'abcdef'.startswith('c', -4, -1) }}").render()).toBe("true");
		expect(new Template("{{ 'abcdef'.startswith('a', -10) }}").render()).toBe("true");
	});

	it("supports tuple targets in startswith with slice bounds", () => {
		expect(new Template("{{ 'abc'.startswith(('x', 'b'), 1) }}").render()).toBe("true");
		expect(new Template("{{ 'abc'.startswith(('x', 'y'), 1) }}").render()).toBe("false");
	});

	it("supports none/null open bounds in startswith", () => {
		expect(new Template("{{ 'abc'.startswith('b', 1, none) }}").render()).toBe("true");
		expect(new Template("{{ 'abc'.startswith('a', none, 2) }}").render()).toBe("true");
	});

	it("supports optional start and end arguments in endswith", () => {
		expect(new Template("{{ 'abc'.endswith('b', 0, 2) }}").render()).toBe("true");
		expect(new Template("{{ 'abc'.endswith('c', 0, 2) }}").render()).toBe("false");
		expect(new Template("{{ 'abcdef'.endswith('d', 1, 4) }}").render()).toBe("true");
		expect(new Template("{{ 'abcdef'.endswith('', 2, 2) }}").render()).toBe("true");
		expect(new Template("{{ 'abcdef'.endswith('d', 4, 2) }}").render()).toBe("false");
	});

	it("supports negative indexing in endswith", () => {
		expect(new Template("{{ 'abcdef'.endswith('d', 0, -2) }}").render()).toBe("true");
		expect(new Template("{{ 'abcdef'.endswith('e', -3, -1) }}").render()).toBe("true");
		expect(new Template("{{ 'abcdef'.endswith('f', -10) }}").render()).toBe("true");
	});

	it("supports tuple targets in endswith with slice bounds", () => {
		expect(new Template("{{ 'abc'.endswith(('b', 'z'), 0, 2) }}").render()).toBe("true");
		expect(new Template("{{ 'abc'.endswith(('a', 'z'), 0, 2) }}").render()).toBe("false");
	});

	it("supports keyword arguments for start and end", () => {
		expect(new Template("{{ 'abc'.startswith('b', start=1) }}").render()).toBe("true");
		expect(new Template("{{ 'abc'.endswith('b', end=2) }}").render()).toBe("true");
		expect(new Template("{{ 'abc'.startswith('b', start=1, end=2) }}").render()).toBe("true");
	});

	it("throws on invalid non-integer slice bounds", () => {
		expect(() => new Template("{{ 'abc'.startswith('b', 'invalid') }}").render()).toThrow(
			"startswith() start argument must be an integer or null",
		);
		expect(() => new Template("{{ 'abc'.endswith('b', 0, 'invalid') }}").render()).toThrow(
			"endswith() end argument must be an integer or null",
		);
	});

	it("validates pattern and tuple elements even on inverted slice range", () => {
		expect(() => new Template("{{ 'abc'.startswith(123, 2, 1) }}").render()).toThrow(
			"startswith() argument must be a string or tuple of strings",
		);
		expect(() => new Template("{{ 'abc'.startswith([123], 2, 1) }}").render()).toThrow(
			"startswith() tuple elements must be strings",
		);
		expect(() => new Template("{{ 'abc'.endswith(123, 2, 1) }}").render()).toThrow(
			"endswith() argument must be a string or tuple of strings",
		);
		expect(() => new Template("{{ 'abc'.endswith([123], 2, 1) }}").render()).toThrow(
			"endswith() tuple elements must be strings",
		);
	});

	it("correctly handles Unicode code points (emoji / non-BMP characters)", () => {
		expect(new Template("{{ '🤗test🤗'.startswith('test', 1) }}").render()).toBe("true");
		expect(new Template("{{ '🤗test🤗'.startswith('test', 2) }}").render()).toBe("false");
		expect(new Template("{{ '🤗test🤗'.endswith('test', 1, 5) }}").render()).toBe("true");
		expect(new Template("{{ '🤗test🤗'.endswith('🤗', 0, 1) }}").render()).toBe("true");
	});
});
