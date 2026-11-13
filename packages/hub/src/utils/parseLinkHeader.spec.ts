import { describe, expect, it } from "vitest";
import { parseLinkHeader } from "./parseLinkHeader";

const next = "https://hub.example/api/models?page=2";
const prev = "https://hub.example/api/models?page=0";

describe("parseLinkHeader", () => {
	it.each([
		["rel first", `<${next}>; rel="next"; title="next page"`],
		["title before rel", `<${next}>; title="next page"; rel="next"`],
		["type before rel", `<${next}>; type="application/json"; rel="next"`],
		["quoted commas and semicolons", `<${next}>; title="next, page; of models"; rel="next"`],
		["escaped quotes and rel-like text", String.raw`<${next}>; title="not a ; rel=\"prev\" parameter"; rel="next"`],
		["target-like title text", String.raw`<${next}>; title="<https://wrong.example/>; rel=\"prev\""; rel="next"`],
	])("finds the quoted relation with %s", (_, header) => {
		expect(parseLinkHeader(header)).toEqual({ next });
	});

	it("keeps multiple links attached to their own targets", () => {
		expect(parseLinkHeader(`<${prev}>; rel="prev", <${next}>; type="application/json"; rel="next"`)).toEqual({
			prev,
			next,
		});
	});

	it("does not attach the second link's relation to the first target", () => {
		expect(parseLinkHeader(`<${prev}>; title="first", <${next}>; rel="next"`)).toEqual({ next });
	});

	it("does not carry a target across an unsupported link", () => {
		expect(parseLinkHeader(`<${prev}>; title="first", <mailto:someone@example.com>; rel="next"`)).toEqual({});
	});

	it("does not interpret rel-like text inside a quoted title", () => {
		expect(parseLinkHeader(String.raw`<${next}>; title="not a ; rel=\"next\" parameter"`)).toEqual({});
	});

	it("keeps commas inside the target URL", () => {
		const target = `${next}&filter=a,b`;
		expect(parseLinkHeader(`<${target}>; rel="next"`)).toEqual({ next: target });
	});

	it("retains only the first relation parameter for one link", () => {
		expect(parseLinkHeader(`<${next}>; rel="next"; rel="prev"`)).toEqual({ next });
	});

	it("does not add support for unquoted relations", () => {
		expect(parseLinkHeader(`<${next}>; rel=next`)).toEqual({});
	});

	it("returns no links for an empty header", () => {
		expect(parseLinkHeader("")).toEqual({});
	});
});
