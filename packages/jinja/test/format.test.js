import { describe, expect, it } from "vitest";
import { Template } from "../src/index";

/**
 * Tests for formatting templates.
 *
 * This section defines our (opinionated) style guide for formatting templates.
 */
const FORMATTING_TESTS = Object.freeze({
	OPERATOR_PRECEDENCE: {
		template: `{{ "hello" if 1 + 2 * 3 / 4 - 5 == 0 or 1 + 2 * 3 / 4 - 5 == 0 and 1 + 2 * 3 / 4 - 5 == 0 else "bye" }}`,
		formatted: `{{- "hello" if 1 + 2 * 3 / 4 - 5 == 0 or 1 + 2 * 3 / 4 - 5 == 0 and 1 + 2 * 3 / 4 - 5 == 0 else "bye" -}}`,
		rendered: `bye`,
	},
	CHAINED_PROPERTY_ACCESSES: {
		template: `{{ message.content.split('</think>')[0].rstrip('\\n').split('<think>')[-1].lstrip('\\n') }}`,
		formatted: `{{- message.content.split("</think>")[0].rstrip("\\n").split("<think>")[-1].lstrip("\\n") -}}`,
	},
	MEMBERSHIP: {
		template: `{{ 'a' in 'abc' and False }}`,
		formatted: `{{- "a" in "abc" and False -}}`,
		rendered: `false`,
	},
	FILTERS: {
		template: `{{'a' + {'b': 'b'}['b']| upper + 'c'}}`,
		formatted: `{{- "a" + {"b": "b"}["b"] | upper + "c" -}}`,
		rendered: `aBc`,
	},
	UNARY_BINARY_MIXED: {
		template: `{{not 1 not in [1,2,3] and not 1==2 or 1!=2}}`,
		// Technically minimal (according to precedence rules) but less readable:
		// formatted: `{{- not 1 not in [1, 2, 3] and not 1 == 2 or 1 != 2 -}}`,
		formatted: `{{- not (1 not in [1, 2, 3]) and not (1 == 2) or 1 != 2 -}}`,
		rendered: `true`,
	},
	CHAINED_UNARY: {
		template: `{{not not not 1}}`,
		formatted: `{{- not not not 1 -}}`,
		rendered: `false`,
	},
	CHAINED_TERNARY: {
		template: `{{('a' if (true if 1==2 else false) else 'b') if 3==4 else ('c' if 4==5 else 'd')}}`,
		formatted: `{{- "a" if (true if 1 == 2 else false) else "b" if 3 == 4 else "c" if 4 == 5 else "d" -}}`,
		rendered: `d`,
	},
	EXPONENTIATION: {
		template: `{{ (2*3)**2*2**3**2 }}`,
		formatted: `{{- (2 * 3) ** 2 * 2 ** 3 ** 2 -}}`,
		rendered: `2304`,
	},
	EXPONENTIATION_AS_TEST_OPERAND: {
		template: `{{ (2 ** 3) is odd }}`,
		formatted: `{{- (2 ** 3) is odd -}}`,
		rendered: `false`,
	},
	SELECT_EXPRESSION_AS_EXPONENTIATION_OPERAND: {
		template: `{{ (2 if 2) ** 3 }}`,
		formatted: `{{- (2 if 2) ** 3 -}}`,
		rendered: `8`,
	},
	ARGUMENT_UNPACKING: {
		template: `{{ namespace(*[{'a': 1}], **{'b': 2}).b }}`,
		formatted: `{{- namespace(*[{"a": 1}], **{"b": 2}).b -}}`,
		rendered: `2`,
	},
});

describe("format", () => {
	for (const [name, test] of Object.entries(FORMATTING_TESTS)) {
		it(`should format ${name}`, () => {
			const template = new Template(test.template);
			const result = template.format({
				indent: 4,
			});
			expect(result).toEqual(test.formatted);

			if (test.rendered) {
				const rendered = template.render();
				const formatted = new Template(test.formatted);
				const formattedRendered = formatted.render();
				expect(rendered).toEqual(test.rendered);
				expect(formattedRendered).toEqual(test.rendered);
			}
		});
	}
});

describe("parameter declarations", () => {
	it.each([
		`{% macro f(*args) %}x{% endmacro %}`,
		`{% macro f(**kwargs) %}x{% endmacro %}`,
		`{% call(*args) f() %}x{% endcall %}`,
		`{% call(**kwargs) f() %}x{% endcall %}`,
	])("should reject argument unpacking in %s", (template) => {
		expect(() => new Template(template)).toThrowError("Argument unpacking is not allowed in parameter declarations");
	});
});
