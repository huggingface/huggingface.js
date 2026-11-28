import { describe, expect, it } from "vitest";
import { Template } from "../src/index";
import { range } from "../src/utils";

describe("range arguments", () => {
	it.each([
		"range(1.5)",
		"range(1.0)",
		"range(0.5, 3)",
		"range(0, 3.5)",
		"range(0, 3, 0.5)",
		"range(0, 3, 1.0)",
		"range('3')",
		"range(none)",
		"range()",
		"range(0, 3, 1, 9)",
	])("rejects invalid arguments in %s", (expression) => {
		expect(() => new Template(`{{ ${expression} }}`).render()).toThrow();
	});

	it.each([
		["range(3)", "0,1,2"],
		["range(1, 5, 2)", "1,3"],
		["range(3, -1, -1)", "3,2,1,0"],
		["range(0)", ""],
		["range(true)", "0"],
		["range(false, 3, true)", "0,1,2"],
	])("preserves valid calls to %s", (expression, expected) => {
		expect(new Template(`{{ ${expression} | join(',') }}`).render()).toBe(expected);
	});

	it("retains the zero-step error", () => {
		expect(() => new Template("{{ range(0, 3, 0) }}").render()).toThrow(/zero/);
	});

	it.each([
		[0.5, 3, 1],
		[0, 3.5, 1],
		[0, 3, 0.5],
		[0, 1, NaN],
		[0, 1, Infinity],
	])("rejects noninteger utility arguments %j", (start, stop, step) => {
		expect(() => range(start, stop, step)).toThrow();
	});
});
