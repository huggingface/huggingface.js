import { describe, expect, it } from "vitest";
import { Template } from "../src/index";

describe("division by zero", () => {
	it.each([
		"7 / 0",
		"7 // 0",
		"7 % 0",
		"7.5 / 0",
		"7.5 // 0",
		"7.5 % 0",
		"7 / 0.0",
		"7 // 0.0",
		"7 % 0.0",
		"7.5 / -0.0",
		"7.5 // -0.0",
		"7.5 % -0.0",
		"0 / 0",
		"0 // 0",
		"0 % 0",
	])("rejects %s instead of rendering a non-finite number", (expression) => {
		expect(() => new Template(`{{ ${expression} }}`).render()).toThrow(/zero/);
	});

	it.each([
		["7 / 2", "3.5"],
		["7 // 2", "3"],
		["7 % 2", "1"],
		["7.5 // 2", "3.0"],
		["0 / 2", "0.0"],
	])("preserves nonzero division for %s", (expression, expected) => {
		expect(new Template(`{{ ${expression} }}`).render()).toBe(expected);
	});
});
