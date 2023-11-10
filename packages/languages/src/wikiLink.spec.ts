import { describe, expect, it } from "vitest";
import { wikiLink } from "./wikiLink";

describe("wikiLink", () => {
	it("should return the correct link", () => {
		expect(wikiLink("en")).toBe(`https://en.wikipedia.org/wiki/ISO_639:en`);
	});
});
