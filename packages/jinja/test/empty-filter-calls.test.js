import { describe, expect, it } from "vitest";
import { Template } from "../src/index";

describe("empty filter calls", () => {
	it.each([
		["{{ [1, 2] | list() | length }}", "2"],
		["{{ [] | list() | length }}", "0"],
		["{{ true | bool() }}", "true"],
		["{{ false | bool() }}", "false"],
		["{{ 'ABC' | lower() }}", "abc"],
		["{{ 'abc' | upper() }}", "ABC"],
		["{{ ' hello ' | trim() | capitalize() }}", "Hello"],
		["{{ 'hello world' | title() }}", "Hello World"],
		["{{ [1, 2] | length() }}", "2"],
		["{{ {'a': 1, 'b': 2} | length() }}", "2"],
		["{{ -3 | abs() }}", "3"],
		["{{ [1, 2] | reverse() | join(',') }}", "2,1"],
		["{{ [1, 2] | first() }}", "1"],
		["{{ [1, 2] | last() }}", "2"],
		["{{ [1, 1, 2] | unique() | join(',') }}", "1,2"],
		["{{ 'hello' | safe() }}", "hello"],
		["{{ true | string() }}", "true"],
		["{{ {'a': 1, 'b': 2} | items() | length }}", "2"],
	])("renders %s", (source, expected) => {
		expect(new Template(source).render()).toBe(expected);
	});

	it.each([
		"{{ 'abc' | lower(1) }}",
		"{{ 'abc' | length(unexpected=1) }}",
		"{{ 'abc' | unknown() }}",
		"{{ [1, 2] | list(1) }}",
		"{{ true | bool(1) }}",
	])("does not discard unexpected arguments or names in %s", (source) => {
		expect(() => new Template(source).render()).toThrow();
	});
});
