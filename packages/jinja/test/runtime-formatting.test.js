import { describe, it, expect } from "vitest";
import { Template } from "../src/index";

describe("Runtime formatting in text composition", () => {
	it.each([
		["{{ 1.0 ~ ':' ~ (-0.0) }}", "1.0:-0.0"],
		["{{ missing ~ 1.0 }}", "1.0"],
		["{{ 1.0 ~ missing }}", "1.0"],
		["{{ [1, 2] ~ '!' }}", "[1, 2]!"],
		["{{ {'x': 1} ~ '!' }}", '{"x": 1}!'],
		["{{ [1.0, -0.0, 2.5] | join }}", "1.0-0.02.5"],
		["{{ [1.0, -0.0, 2.5] | join(':') }}", "1.0:-0.0:2.5"],
		["{{ [[1, 2], [3]] | join(':') }}", "[1, 2]:[3]"],
		["{{ [{'x': 1}] | join }}", '{"x": 1}'],
	])("preserves value formatting: %s", (source, expected) => {
		expect(new Template(source).render()).toBe(expected);
	});

	it("retains scalar and empty-item compatibility", () => {
		expect(new Template("{{ [none, missing, true, false, 2, 'x']|join(':') }}").render()).toBe("::true:false:2:x");
		expect(new Template("{{ missing ~ true ~ false }}").render()).toBe("truefalse");
		expect(new Template("{{ 'a🤗b'|join(':') }}").render()).toBe("a:🤗:b");
	});

	it("retains null concatenation and undefined arithmetic errors", () => {
		expect(() => new Template("{{ none ~ 'x' }}").render()).toThrow("null");
		expect(() => new Template("{{ missing + 1 }}").render()).toThrow("undefined");
	});
});
