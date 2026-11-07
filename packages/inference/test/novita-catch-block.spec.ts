import { describe, expect, it, vi } from "vitest";
import { NovitaTextToVideoTask } from "../src/providers/novita.js";
import { InferenceClientProviderOutputError } from "../src/errors.js";

describe("NovitaTextToVideoTask.getResponse", () => {
	it("preserves structured error when task result has wrong shape", async () => {
		const task = new NovitaTextToVideoTask();

		const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
		// First call: polling returns valid JSON with wrong shape (no "task" field)
		mockFetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ unexpected: "shape" }), {
				status: 200,
				headers: { "Content-Type": "application/json", "x-request-id": "test" },
			}),
		);

		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch;
		try {
			await expect(
				task.getResponse({ task_id: "test-task-123" }, "https://api.novita.ai/v3/async/model", {
					Authorization: "Bearer test",
				}),
			).rejects.toThrow("failed to get task status");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("throws parse error when response is not valid JSON", async () => {
		const task = new NovitaTextToVideoTask();

		const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
		// First call: polling returns invalid JSON
		mockFetch.mockResolvedValueOnce(
			new Response("not json at all", {
				status: 200,
				headers: { "Content-Type": "application/json", "x-request-id": "test" },
			}),
		);

		const originalFetch = globalThis.fetch;
		globalThis.fetch = mockFetch;
		try {
			await expect(
				task.getResponse({ task_id: "test-task-123" }, "https://api.novita.ai/v3/async/model", {
					Authorization: "Bearer test",
				}),
			).rejects.toThrow("failed to parse task result");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
