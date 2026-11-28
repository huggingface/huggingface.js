import { describe, it, expect } from "vitest";
import { Template } from "../src/index";

describe("Indent line boundaries", () => {
	it.each(["\r", "\r\n", "\v", "\f", "\x1c", "\x1d", "\x1e", "\x85", "\u2028", "\u2029"])(
		"normalizes Python line boundary %j",
		(separator) => {
			const text = `first${separator}second${separator}${separator}last`;
			for (const filter of ["indent", "indent()", "indent(4)"]) {
				expect(new Template(`{{ text|${filter} }}`).render({ text })).toBe("first\n    second\n\n    last");
			}
		},
	);

	it.each([
		["a\r\nb", "indent(2, true)", "  a\n  b"],
		["a\r\n\r\nb", "indent('> ', true, true)", "> a\n> \n> b"],
		["a\n", "indent", "a\n"],
		["a\n", "indent(2, false, true)", "a\n  "],
		["a\r", "indent", "a"],
		["", "indent(2, true)", "  "],
		["", "indent", ""],
		["\n", "indent", "\n"],
		["a\r\nb", "indent(width='>', first=true)", ">a\n>b"],
	])("preserves options and trailing-line semantics: %j %s", (text, filter, expected) => {
		expect(new Template(`{{ text|${filter} }}`).render({ text })).toBe(expected);
	});
});
