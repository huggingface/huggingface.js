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
		target: `{{- "hello" if 1 + 2 * 3 / 4 - 5 == 0 or 1 + 2 * 3 / 4 - 5 == 0 and 1 + 2 * 3 / 4 - 5 == 0 else "bye" -}}`,
	},
	CHAINED_PROPERTY_ACCESSES: {
		template: `{{ message.content.split('</think>')[0].rstrip('\\n').split('<think>')[-1].lstrip('\\n') }}`,
		target: `{{- message.content.split("</think>")[0].rstrip("\\n").split("<think>")[-1].lstrip("\\n") -}}`,
	},
});

describe("format", () => {
	for (const [name, test] of Object.entries(FORMATTING_TESTS)) {
		it(`should format ${name}`, () => {
			const template = new Template(test.template);
			const result = template.format({
				indent: 4,
			});
			expect(result).toEqual(test.target);
		});
	}
});
