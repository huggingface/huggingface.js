import { describe, it, expect } from "vitest";

import { Template } from "../src/index";

describe("string filter", () => {
	it("should convert an object (dict) to a string", () => {
		// Chat templates do this for every tool, e.g. `ns.tools ~ (tool | string)` in SmolLM3
		const tool = { type: "function", function: { name: "get_weather", parameters: { city: "string" } } };
		const template = new Template(`{{ tool | string }}`);
		expect(template.render({ tool })).toBe(
			`{"type": "function", "function": {"name": "get_weather", "parameters": {"city": "string"}}}`,
		);
	});

	it("should allow concatenating a stringified object", () => {
		const template = new Template(`{% for tool in tools %}{{ "<tool>" ~ (tool | string) ~ "</tool>" }}{% endfor %}`);
		expect(template.render({ tools: [{ name: "a" }, { name: "b" }] })).toBe(
			`<tool>{"name": "a"}</tool><tool>{"name": "b"}</tool>`,
		);
	});

	it("should match the output of printing the object directly", () => {
		const tool = { name: "a", nested: { x: [1, 2] } };
		const template = new Template(`{{ tool | string }}|{{ tool }}`);
		const [filtered, printed] = template.render({ tool }).split("|");
		expect(filtered).toBe(printed);
	});
});
