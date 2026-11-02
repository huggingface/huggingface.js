import { afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "./randomUUID";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("randomUUID", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("uses crypto.randomUUID when it is available", () => {
		const spy = vi.spyOn(globalThis.crypto, "randomUUID");
		expect(randomUUID()).toMatch(UUID_V4);
		expect(spy).toHaveBeenCalledOnce();
		spy.mockRestore();
	});

	it("falls back to crypto.getRandomValues outside a secure context", () => {
		const getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
		vi.stubGlobal("crypto", { getRandomValues });

		const first = randomUUID();
		const second = randomUUID();
		expect(first).toMatch(UUID_V4);
		expect(second).toMatch(UUID_V4);
		expect(first).not.toBe(second);
	});
});
