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
		formatted: `{{- ("a" if (true if 1 == 2 else false) else "b") if 3 == 4 else "c" if 4 == 5 else "d" -}}`,
		rendered: `d`,
	},
	TERNARY_IN_TRUE_BRANCH: {
		template: `{{ ("A" if true else "B") if false else "C" }}`,
		formatted: `{{- ("A" if true else "B") if false else "C" -}}`,
		rendered: `C`,
	},
	EXPONENTIATION_PRECEDENCE_AND_ASSOCIATIVITY: {
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
	NOT_AS_EXPONENTIATION_OPERAND: {
		template: `{{ (not true) ** 2 }}`,
		formatted: `{{- (not true) ** 2 -}}`,
		rendered: `0`,
	},
	NOT_AS_COMPARISON_AND_LOGICAL_OPERAND: {
		template: `{{ (not 1) == false and true and not false }}`,
		formatted: `{{- (not 1) == false and true and not false -}}`,
		rendered: `true`,
	},
	ARGUMENT_UNPACKING: {
		template: `{{ namespace(*[{'a': 1}], **{'b': 2}).b }}`,
		formatted: `{{- namespace(*[{"a": 1}], **{"b": 2}).b -}}`,
		rendered: `2`,
	},
	SELECT_EXPRESSIONS_IN_CALL_AND_ARRAY_ARGUMENTS: {
		template: `{{ range(1 if 2, 5 or 6) | join(",") }}|{{ [1 if 2, 3 if 4] | join(",") }}`,
		formatted: `{{- range(1 if 2, 5 or 6) | join(",") -}}\n{{- "|" -}}\n{{- [1 if 2, 3 if 4] | join(",") -}}`,
		rendered: `1,2,3,4|1,3`,
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
