import { describe, expect, it } from "vitest";

import { Template } from "../src/index";

describe("map attribute fallbacks", () => {
	it.each([
		{
			name: "mixed values with missing attributes",
			source: `{{ items | map(attribute="name", default="missing") | list | tojson }}`,
			items: [{ name: "Ada" }, null, 7, false, "value", {}, { name: null }, { name: "" }],
			expected: `["Ada", "missing", "missing", "missing", "missing", "missing", null, ""]`,
		},
		{
			name: "sequence items with a string index",
			source: `{{ items | map(attribute="0", default="missing") | list | tojson }}`,
			items: [[10, 20], [], [30]],
			expected: `[10, "missing", 30]`,
		},
		{
			name: "nested paths starting at a sequence",
			source: `{{ items | map(attribute="0.name", default="missing") | list | tojson }}`,
			items: [[{ name: "Ada" }], [], [{}]],
			expected: `["Ada", "missing", "missing"]`,
		},
		{
			name: "missing attributes without an explicit map default",
			source: `{% for value in items | map(attribute="name") %}{{ value | default("missing") }}|{% endfor %}`,
			items: [{ name: "Ada" }, null],
			expected: "Ada|missing|",
		},
	])("handles $name", ({ source, items, expected }) => {
		const template = new Template(source);
		expect(template.render({ items })).toBe(expected);
		expect(new Template(template.format()).render({ items })).toBe(expected);
	});
});
