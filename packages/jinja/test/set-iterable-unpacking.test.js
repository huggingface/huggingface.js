import { describe, it, expect } from "vitest";
import { Template } from "../src/index";

describe("Set iterable unpacking", () => {
	it.each([
		["ab", "a|b"],
		["🤗x", "🤗|x"],
		[{ first: 1, second: 2 }, "first|second"],
		[[1, 2], "1|2"],
	])("unpacks string code points and mapping keys: %j", (value, expected) => {
		expect(new Template("{% set a,b = value %}{{ a }}|{{ b }}").render({ value })).toBe(expected);
	});

	it("supports tuple controls and assignment in a loop", () => {
		expect(new Template("{% set a,b = ('x','y') %}{{ a }}|{{ b }}").render()).toBe("x|y");
		expect(
			new Template("{% for value in ['ab','cd'] %}{% set a,b = value %}{{ a }}{{ b }};{% endfor %}").render(),
		).toBe("ab;cd;");
	});

	it.each(["", "a", "abc", {}, { a: 1 }, { a: 1, b: 2, c: 3 }])("rejects mismatched unpacking lengths: %j", (value) => {
		expect(() => new Template("{% set a,b = value %}").render({ value })).toThrow(/Too (few|many) items/);
	});

	it.each([1, null, true])("retains non-iterable errors: %j", (value) => {
		expect(() => new Template("{% set a,b = value %}").render({ value })).toThrow(
			"Cannot unpack non-iterable type in set",
		);
	});
});
