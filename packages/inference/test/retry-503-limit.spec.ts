import { describe, expect, it, vi } from "vitest";
import { innerRequest, innerStreamingRequest } from "../src/utils/request.js";
import { getProviderHelper } from "../src/lib/getProviderHelper.js";
import { InferenceClientProviderApiError } from "../src/errors.js";

function makeProviderHelper() {
	return getProviderHelper("hf-inference", "conversational");
}

describe("503 retry limit", () => {
	it("innerRequest stops retrying after the limit and throws", async () => {
		const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(
				new Response("Service Unavailable", {
					status: 503,
					headers: { "Content-Type": "text/plain; charset=utf-8" },
				}),
			),
		);

		await expect(
			innerRequest(
				{ model: "test-model", endpointUrl: "https://test.example.com", accessToken: "hf_test", messages: [] },
				makeProviderHelper(),
				{ fetch: mockFetch, task: "conversational" },
			),
		).rejects.toThrow(InferenceClientProviderApiError);

		// 1 initial + 10 retries = 11 total calls
		expect(mockFetch).toHaveBeenCalledTimes(11);
	});

	it("innerStreamingRequest stops retrying after the limit and throws", async () => {
		const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(
				new Response("Service Unavailable", {
					status: 503,
					headers: { "Content-Type": "text/plain; charset=utf-8" },
				}),
			),
		);

		const gen = innerStreamingRequest(
			{ model: "test-model", endpointUrl: "https://test.example.com", accessToken: "hf_test", messages: [] },
			makeProviderHelper(),
			{ fetch: mockFetch, task: "conversational" },
		);

		await expect(gen.next()).rejects.toThrow(InferenceClientProviderApiError);
		expect(mockFetch).toHaveBeenCalledTimes(11);
	});

	it("succeeds if the server recovers before the limit", async () => {
		let callCount = 0;
		const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			callCount++;
			if (callCount <= 3) {
				return Promise.resolve(
					new Response("Service Unavailable", {
						status: 503,
						headers: { "Content-Type": "text/plain; charset=utf-8" },
					}),
				);
			}
			return Promise.resolve(
				new Response(JSON.stringify({ result: "ok" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);
		});

		const result = await innerRequest(
			{ model: "test-model", endpointUrl: "https://test.example.com", accessToken: "hf_test", messages: [] },
			makeProviderHelper(),
			{ fetch: mockFetch, task: "conversational" },
		);

		expect(result.data).toEqual({ result: "ok" });
		expect(mockFetch).toHaveBeenCalledTimes(4);
	});
});
