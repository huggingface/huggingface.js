import { describe, expect, it } from "vitest";
import { Template } from "../src/index";

// Expected values match Python str.startswith/str.endswith, including empty patterns.
const cases = [
	["abc", "startswith('b', 1)", true],
	["abc", "startswith('a', 1)", false],
	["abc", "startswith('bc', 1, 2)", false],
	["abc", "startswith('bc', 1, 3)", true],
	["abc", "startswith(('x', 'b'), 1)", true],
	["abc", "endswith('b', 0, 2)", true],
	["abc", "endswith('c', 0, 2)", false],
	["abc", "endswith(('x', 'b'), 0, 2)", true],
	["abc", "startswith('b', -2, -1)", true],
	["abc", "endswith('b', -2, -1)", true],
	["abc", "startswith('', 4)", false],
	["abc", "endswith('', 4)", false],
	["abc", "startswith('', 3)", true],
	["abc", "endswith('', 3)", true],
	["abc", "startswith('', 2, 1)", false],
	["abc", "endswith('', 2, 1)", false],
	["", "startswith('', 0)", true],
	["", "endswith('', 1)", false],
	["abc", "startswith('a', none, none)", true],
	["abc", "endswith('c', none, none)", true],
	["abc", "startswith('b', true, 2)", true],
	["abc", "endswith('c', -99, 99)", true],
	["a😀b", "startswith('😀', 1, 2)", true],
	["a😀b", "endswith('😀', 0, 2)", true],
	["a😀b", "endswith('b', 0, 2)", false],
	["a😀b", "startswith('😀', -2, -1)", true],
	["abc", "startswith('a')", true],
	["abc", "endswith('c')", true],
];

describe("string affix bounds", () => {
	it.each(cases)("%s.%s", (source, expression, expected) => {
		const template = new Template(`{% if source.${expression} %}yes{% else %}no{% endif %}`);
		expect(template.render({ source })).toBe(expected ? "yes" : "no");
	});
	for (const method of ["startswith", "endswith"]) {
		for (const argumentsText of ["'a', '1'", "'a', 1.5", "'a', 0, []", "'a', 0, 1, 2"]) {
			it(`rejects ${method}(${argumentsText})`, () => {
				expect(() => new Template(`{{ source.${method}(${argumentsText}) }}`).render({ source: "abc" })).toThrow();
			});
		}
	}
});
