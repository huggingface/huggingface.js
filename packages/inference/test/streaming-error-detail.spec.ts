import { describe, expect, it, vi } from "vitest";
import { innerStreamingRequest } from "../src/utils/request.js";
import { getProviderHelper } from "../src/lib/getProviderHelper.js";
import { InferenceClientProviderApiError } from "../src/errors.js";

function makeProviderHelper() {
	return getProviderHelper("hf-inference", "conversational");
}

function mockFetch(status: number, body: unknown): typeof fetch {
	return vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
		Promise.resolve(
			new Response(JSON.stringify(body), {
				status,
				headers: { "Content-Type": "application/json" },
			}),
		),
	);
}

function streamGen(fetchFn: typeof fetch) {
	return innerStreamingRequest(
		{ model: "test-model", endpointUrl: "https://test.example.com", accessToken: "hf_test", messages: [] },
		makeProviderHelper(),
		{ fetch: fetchFn, task: "conversational" },
	);
}

describe("innerStreamingRequest error handling", () => {
	it("surfaces output.detail from JSON error responses", async () => {
		const gen = streamGen(mockFetch(422, { detail: "Input validation error: best_of must be > 0" }));
		await expect(gen.next()).rejects.toThrow(InferenceClientProviderApiError);
	});

	it("includes detail message text in the thrown error", async () => {
		const gen = streamGen(mockFetch(422, { detail: "Input validation error: best_of must be > 0" }));
		await expect(gen.next()).rejects.toThrow("Input validation error: best_of must be > 0");
	});

	it("surfaces output.error from JSON error responses", async () => {
		const gen = streamGen(mockFetch(500, { error: "Model is currently loading" }));
		await expect(gen.next()).rejects.toThrow("Model is currently loading");
	});

	it("surfaces output.message from JSON error responses", async () => {
		const gen = streamGen(mockFetch(400, { message: "Invalid request parameters" }));
		await expect(gen.next()).rejects.toThrow("Invalid request parameters");
	});

	it("surfaces OpenAI-style nested error.message", async () => {
		const gen = streamGen(mockFetch(400, { error: { message: "Invalid model", type: "invalid_request_error" } }));
		await expect(gen.next()).rejects.toThrow("Invalid model");
	});

	it("does not let an object error shadow top-level detail", async () => {
		const gen = streamGen(
			mockFetch(422, {
				error: { message: "Nested error" },
				detail: "Input validation error: best_of must be > 0",
			}),
		);
		await expect(gen.next()).rejects.toThrow("Input validation error: best_of must be > 0");
	});

	it("does not let an object error shadow top-level message", async () => {
		const gen = streamGen(
			mockFetch(400, { error: { message: "Nested error" }, message: "Invalid request parameters" }),
		);
		await expect(gen.next()).rejects.toThrow("Invalid request parameters");
	});
});
