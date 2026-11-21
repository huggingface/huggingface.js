import { describe, expect, it } from "vitest";
import { Template } from "../src/index";

describe("numeric string conversion", () => {
	it.each([
		["inf", "inf"],
		["+Infinity", "inf"],
		["-INF", "-inf"],
		["nan", "nan"],
		["-NaN", "nan"],
		["1e309", "inf"],
		["-1e309", "-inf"],
	])("renders non-finite %j with Python spellings", (value, expected) => {
		for (const filter of ["float", "float()", "float(7)", "float(default=8)"]) {
			expect(new Template(`{{ value | ${filter} }}`).render({ value })).toBe(expected);
			expect(new Template(`{{ value | ${filter} | string }}`).render({ value })).toBe(expected);
		}
	});

	it.each([
		["7.0", "7.0"],
		["-0.0", "-0.0"],
		["0", "0.0"],
	])("preserves finite formatting for %j", (value, expected) => {
		expect(new Template("{{ value | float }}").render({ value })).toBe(expected);
	});

	it.each(["12oops", "1.5oops", "1e", "1e+", "1__2", "1_.2", "_12", "12_", "0xff", "1 2", "", " ", "\ufeff1"])(
		"uses defaults for the complete invalid string %j",
		(value) => {
			const template = new Template(
				"{{ value | int }}|{{ value | int(7) }}|{{ value | int(default=8) }}|{{ value | float }}|{{ value | float(7.5) }}|{{ value | float(default=8.5) }}",
			);
			expect(template.render({ value })).toBe("0|7|8|0.0|7.5|8.5");
		},
	);

	it.each([
		["12", "12|12.0"],
		["-3.9", "-3|-3.9"],
		["1e2", "100|100.0"],
		["1e-2", "0|0.01"],
		["+1_200.5", "1200|1200.5"],
		[".5", "0|0.5"],
		["1.", "1|1.0"],
		["-0.0", "0|-0.0"],
		["\u008512.5\u0085", "12|12.5"],
		["١٢.٥", "12|12.5"],
		["𝟙_𝟚.𝟝", "12|12.5"],
	])("converts the complete numeric string %j", (value, expected) => {
		expect(new Template("{{ value | int(7) }}|{{ value | float(7.5) }}").render({ value })).toBe(expected);
	});

	it.each(["inf", "+Infinity", "-INF", "NaN", "-nan", "1e309"])("uses integer defaults for non-finite %j", (value) => {
		expect(new Template("{{ value | int }}|{{ value | int(7) }}").render({ value })).toBe("0|7");
	});

	it.each(["inf", "+Infinity", "1e309"])("accepts positive infinity for float %j", (value) => {
		expect(new Template("{{ (value | float(7)) > bound }}").render({ value, bound: 1e308 })).toBe("true");
	});

	it.each(["nan", "-NaN"])("accepts NaN for float %j", (value) => {
		expect(new Template("{% set number = value | float(7) %}{{ number != number }}").render({ value })).toBe("true");
	});
});
