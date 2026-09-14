import { describe, expect, it } from "vitest";
import { hasH2DefaultFetch } from "./defaultFetch";

describe("hasH2DefaultFetch", () => {
	it("matches Node with undici >= 8", () => {
		expect(hasH2DefaultFetch({ node: "26.1.0", undici: "8.2.0" }, false)).toBe(true);
		expect(hasH2DefaultFetch({ node: "27.0.0", undici: "10.0.0" }, false)).toBe(true);
	});

	it("does not match Node with undici < 8", () => {
		expect(hasH2DefaultFetch({ node: "24.14.1", undici: "7.24.4" }, false)).toBe(false);
		expect(hasH2DefaultFetch({ node: "20.19.0", undici: "6.21.0" }, false)).toBe(false);
	});

	it("does not match Bun, browsers, or runtimes without undici", () => {
		expect(hasH2DefaultFetch({ bun: "1.4.2", undici: "8.0.0" }, false)).toBe(false);
		expect(hasH2DefaultFetch({ node: "26.1.0", undici: "8.2.0" }, true)).toBe(false);
		expect(hasH2DefaultFetch({}, false)).toBe(false);
	});

	it("reads the current runtime by default", () => {
		expect(hasH2DefaultFetch(undefined, false)).toBe(hasH2DefaultFetch(process.versions, false));
	});
});
