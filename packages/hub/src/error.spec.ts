import { describe, expect, it } from "vitest";
import { createApiError, EgressLimitReachedError, HubApiError } from "./error";

describe("createApiError", () => {
	it("throws an EgressLimitReachedError on a 402 with the EgressLimitReached error code", async () => {
		const response = new Response(JSON.stringify({ error: "Downloads are blocked." }), {
			status: 402,
			headers: { "Content-Type": "application/json", "X-Error-Code": "EgressLimitReached", "X-Request-Id": "abc" },
		});

		const error = await createApiError(response).catch((err) => err);

		expect(error).toBeInstanceOf(EgressLimitReachedError);
		expect(error).toBeInstanceOf(HubApiError);
		expect(error.statusCode).toBe(402);
		expect(error.requestId).toBe("abc");
		expect(error.message).toContain("Downloads are blocked.");
	});

	it("throws a plain HubApiError on other errors", async () => {
		const response = new Response("Payment required", { status: 402 });

		const error = await createApiError(response).catch((err) => err);

		expect(error).toBeInstanceOf(HubApiError);
		expect(error).not.toBeInstanceOf(EgressLimitReachedError);
	});
});
