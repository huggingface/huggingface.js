import { describe, it, expect } from "vitest";
import { Template } from "../src/index";

const rows = [
	{ id: "z", group: 1, name: "z", nested: { rank: 2 } },
	{ id: "a", group: 0, name: "a", nested: { rank: 1 } },
	{ id: "b", group: 1, name: "b", nested: { rank: 1 } },
	{ id: "B", group: 1, name: "B", nested: { rank: 1 } },
];
const render = (filter) => new Template(`{{ rows|${filter}|map(attribute='id')|join(',') }}`).render({ rows });

describe("Sort by multiple attributes", () => {
	it.each([
		["sort(attribute='group,name')", "a,b,B,z"],
		["sort(false, false, 'group,name')", "a,b,B,z"],
		["sort(reverse=true, attribute='group,name')", "z,b,B,a"],
		["sort(case_sensitive=true, attribute='group,name')", "a,B,b,z"],
		["sort(attribute='nested.rank,name')", "a,b,B,z"],
		["sort(attribute='group')", "a,z,b,B"],
		["sort(attribute='name')", "a,b,B,z"],
	])("compares priority keys lexicographically: %s", (filter, expected) => {
		expect(render(filter)).toBe(expected);
	});

	it("supports numeric paths and empty input", () => {
		expect(
			new Template("{{ rows|sort(attribute='0,1')|tojson }}").render({
				rows: [
					[1, "z"],
					[0, "a"],
					[1, "b"],
				],
			}),
		).toBe('[[0, "a"], [1, "b"], [1, "z"]]');
		expect(new Template("{{ []|sort(attribute='a,b')|tojson }}").render()).toBe("[]");
	});

	it("retains whole-value sorting and invalid option errors", () => {
		expect(new Template("{{ [3, 1, 2]|sort(attribute=none)|tojson }}").render()).toBe("[1, 2, 3]");
		expect(new Template("{{ rows|sort(attribute=0)|tojson }}").render({ rows: [[2], [1]] })).toBe("[[1], [2]]");
		expect(() => render("sort(attribute=true)")).toThrow("attribute");
	});
});
