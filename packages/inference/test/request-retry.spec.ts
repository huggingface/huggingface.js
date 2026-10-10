import { afterEach, describe, expect, it, vi } from "vitest";
import { chatCompletion } from "../src/tasks/nlp/chatCompletion.js";

const itWithFakeTimers = typeof window !== "undefined" && typeof window.document !== "undefined" ? it.skip : it;

describe("Retries on 503", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	itWithFakeTimers("retries a 503 up to 3 times, waiting for Retry-After between attempts", async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(
				new Response(JSON.stringify({ error: "Service unavailable" }), {
					status: 503,
					headers: { "Content-Type": "application/json", "Retry-After": "5" },
				}),
			),
		);

		const responsePromise = chatCompletion(
			{
				endpointUrl: "https://example.com/v1/chat/completions",
				accessToken: "hf_token",
				messages: [{ role: "user", content: "Hello" }],
			},
			{ fetch: fetchMock },
		);
		const rejection = expect(responsePromise).rejects.toThrow();

		await vi.advanceTimersByTimeAsync(4_999);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		expect(fetchMock).toHaveBeenCalledTimes(2);

		await vi.advanceTimersByTimeAsync(10_000);
		await rejection;
		expect(fetchMock).toHaveBeenCalledTimes(4);
	});
});
