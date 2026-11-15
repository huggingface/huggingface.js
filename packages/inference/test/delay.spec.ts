import { afterEach, describe, expect, it, vi } from "vitest";
import { delay } from "../src/utils/delay.js";

const itNode = typeof process !== "undefined" && process.versions?.node ? it : it.skip;

describe("delay timer references", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	itNode("retains a Node timer reference when explicitly requested", async () => {
		const timers = vi.spyOn(globalThis, "setTimeout");
		const waiting = delay(1, undefined, { ref: true });
		expect(timers.mock.results[0].value.hasRef()).toBe(true);
		await waiting;
	});

	itNode("preserves the unreferenced default for existing callers", async () => {
		const timers = vi.spyOn(globalThis, "setTimeout");
		const waiting = delay(1);
		expect(timers.mock.results[0].value.hasRef()).toBe(false);
		await waiting;
	});
});
