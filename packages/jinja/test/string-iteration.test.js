import { describe, expect, it } from "vitest";
import { Template } from "../src/index";

describe("string iteration", () => {
	it.each([
		["abc", "1:a:false|2:b:false|3:c:true|"],
		["A😀B", "1:A:false|2:😀:false|3:B:true|"],
		["e\u0301", "1:e:false|2:́:true|"],
		["", "empty"],
	])("iterates the code points of %j", (value, expected) => {
		const template = new Template(
			"{% for char in value %}{{ loop.index }}:{{ char }}:{{ loop.last }}|{% else %}empty{% endfor %}",
		);
		expect(template.render({ value })).toBe(expected);
	});

	it("computes loop metadata after selecting characters", () => {
		const template = new Template(
			"{% for char in value if char != 'x' %}{{ char }}:{{ loop.index }}/{{ loop.length }}|{% endfor %}",
		);
		expect(template.render({ value: "xA😀x" })).toBe("A:1/2|😀:2/2|");
	});

	it("takes the else branch when all characters are filtered out", () => {
		expect(
			new Template("{% for char in value if char != 'x' %}{{ char }}{% else %}empty{% endfor %}").render({
				value: "xx",
			}),
		).toBe("empty");
	});

	it("exposes neighboring characters", () => {
		const template = new Template(
			"{% for char in value %}{{ loop.previtem | default('-') }}:{{ char }}:{{ loop.nextitem | default('-') }}|{% endfor %}",
		);
		expect(template.render({ value: "A😀" })).toBe("-:A:😀|A:😀:-|");
	});
});
