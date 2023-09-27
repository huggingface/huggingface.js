import { describe, expect, it } from "vitest";

if (!process.env.HF_ACCESS_TOKEN) {
	console.warn("Set HF_ACCESS_TOKEN in the env to run the tests for better rate limits");
}

describe("HfAgent", () => {
	it("will eventually need some tests", async () => {
		expect(true).toBeTruthy();
	});
});
