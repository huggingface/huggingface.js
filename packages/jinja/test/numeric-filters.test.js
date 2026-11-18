import { describe, it, expect } from "vitest";

import { Template } from "../src/index";

// Expected outputs come from Python Jinja2 3.1.
const render = (source) => new Template(source).render({});

describe("round filter", () => {
	it.each([
		["{{ 3.14159|round(2) }}", "3.14"],
		["{{ 3.5|round }}", "4.0"],
		["{{ 2.5|round }}", "2.0"], // ties go to the even neighbour
		["{{ -2.5|round }}", "-2.0"],
		["{{ 0.125|round(2) }}", "0.12"],
		["{{ 0.375|round(2) }}", "0.38"],
		["{{ 2.675|round(2) }}", "2.67"], // 2.675 is slightly below the tie in binary
		["{{ 1234.567|round(-2) }}", "1200.0"],
		["{{ 3|round }}", "3"],
		["{{ 1234|round(2) }}", "1234"],
		["{{ 3.7|round(0, 'floor') }}", "3.0"],
		["{{ 3.2|round(0, 'ceil') }}", "4.0"],
		["{{ 3.14159|round(3, 'ceil') }}", "3.142"],
		["{{ 3.14159|round(precision=1) }}", "3.1"],
		["{{ 5|round(1, 'floor') }}", "5.0"],
		["{{ 10.4|round|int }}", "10"],
	])("%s", (source, expected) => {
		expect(render(source)).toBe(expected);
	});

	it("rejects non-numbers and unknown methods", () => {
		expect(() => render("{{ 'a'|round }}")).toThrow();
		expect(() => render("{{ 1.5|round(0, 'up') }}")).toThrow();
	});
});

describe("sum filter", () => {
	it.each([
		["{{ [1, 2, 3]|sum }}", "6"],
		["{{ [1, 2.5]|sum }}", "3.5"],
		["{{ []|sum }}", "0"],
		["{{ [1, 2]|sum(start=10) }}", "13"],
		["{{ [1, 2]|sum(start=0.5) }}", "3.5"],
		["{{ [{'a': 1}, {'a': 4}]|sum(attribute='a') }}", "5"],
		["{{ [{'a': 1}, {'a': 4}]|sum('a') }}", "5"],
	])("%s", (source, expected) => {
		expect(render(source)).toBe(expected);
	});

	it("rejects non-numeric items", () => {
		expect(() => render("{{ ['a', 'b']|sum }}")).toThrow();
	});
});

describe("min and max filters", () => {
	it.each([
		["{{ [3, 1, 2]|min }}{{ [3, 1, 2]|max }}", "13"],
		["{{ [1, 2.5]|max }}", "2.5"],
		["{{ ['b', 'A', 'c']|min }}", "A"],
		["{{ ['b', 'A', 'c']|max }}", "c"],
		["{{ ['b', 'A', 'c']|min(case_sensitive=true) }}", "A"],
		["{{ ['b', 'B', 'a']|max(true) }}", "b"],
		["{% set m = [{'a': 1}, {'a': 4}]|max(attribute='a') %}{{ m['a'] }}", "4"],
		["{% set m = [{'a': 1}, {'a': 4}]|min(attribute='a') %}{{ m['a'] }}", "1"],
		["{{ []|max is undefined }}", "true"],
	])("%s", (source, expected) => {
		expect(render(source)).toBe(expected);
	});
});
