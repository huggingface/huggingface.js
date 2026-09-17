import { describe, expect, it } from "vitest";
import { hasH2Fetch, withHttp1, type Dispatcher } from "./xetFetch";

describe("hasH2Fetch", () => {
	it("matches Node with undici >= 8", () => {
		expect(hasH2Fetch({ node: "26.1.0", undici: "8.2.0" }, false)).toBe(true);
		expect(hasH2Fetch({ node: "27.0.0", undici: "10.0.0" }, false)).toBe(true);
	});

	it("does not match Node with undici < 8", () => {
		expect(hasH2Fetch({ node: "24.14.1", undici: "7.24.4" }, false)).toBe(false);
		expect(hasH2Fetch({ node: "20.19.0", undici: "6.21.0" }, false)).toBe(false);
	});

	it("does not match Bun, browsers, or runtimes without undici", () => {
		expect(hasH2Fetch({ bun: "1.4.2", undici: "8.0.0" }, false)).toBe(false);
		expect(hasH2Fetch({ node: "26.1.0", undici: "8.2.0" }, true)).toBe(false);
		expect(hasH2Fetch({}, false)).toBe(false);
	});

	it("reads the current runtime by default", () => {
		expect(hasH2Fetch(undefined, false)).toBe(hasH2Fetch(process.versions, false));
	});
});

describe("withHttp1", () => {
	it("forwards to the base dispatcher with allowH2 disabled and the handler untouched", () => {
		const calls: Array<{ options: Record<string, unknown>; handler: unknown }> = [];
		const base: Dispatcher = {
			dispatch(options, handler) {
				calls.push({ options, handler });
				return true;
			},
		};
		const handler = { onHeaders: () => true };
		const options = { origin: "https://example.com", path: "/x", method: "GET" };

		expect(withHttp1(base).dispatch(options, handler)).toBe(true);
		expect(calls).toEqual([{ options: { ...options, allowH2: false }, handler }]);
		expect(options).not.toHaveProperty("allowH2");
	});
});
