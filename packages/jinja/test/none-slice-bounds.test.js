import { describe, it, expect } from "vitest";
import { Template } from "../src/index";

describe("Explicit none slice bounds", () => {
	it.each([
		["{{ xs[none:]|tojson }}", "[0, 1, 2, 3]"],
		["{{ xs[:none]|tojson }}", "[0, 1, 2, 3]"],
		["{{ xs[::none]|tojson }}", "[0, 1, 2, 3]"],
		["{{ xs[none:none:none]|tojson }}", "[0, 1, 2, 3]"],
		["{{ xs[1:none:2]|tojson }}", "[1, 3]"],
		["{{ xs[none:none:-1]|tojson }}", "[3, 2, 1, 0]"],
		["{{ xs[start:stop:step]|tojson }}", "[0, 1, 2, 3]"],
		["{{ 'a🤗b'[none:none:-1] }}", "b🤗a"],
		["{{ [][none:none:none]|tojson }}", "[]"],
	])("treats none as an omitted bound: %s", (source, expected) => {
		expect(new Template(source).render({ xs: [0, 1, 2, 3], start: null, stop: null, step: null })).toBe(expected);
	});

	it.each(["{{ xs['1':] }}", "{{ xs[:1.5] }}", "{{ xs[::'2'] }}", "{{ xs[none:none:0] }}"])(
		"retains invalid-bound errors: %s",
		(source) => {
			expect(() => new Template(source).render({ xs: [0, 1] })).toThrow();
		},
	);
});
