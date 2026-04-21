import { afterEach, describe, expect, it, vi } from "vitest";
import { FalAITextToImageTask } from "../src/providers/fal-ai.js";

describe("FalAI queue polling", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("aborts before the next polling request starts", async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
		vi.stubGlobal("fetch", fetchMock);

		const task = new FalAITextToImageTask();
		const controller = new AbortController();

		const responsePromise = task.getResponse(
			{
				request_id: "request-id",
				status: "IN_PROGRESS",
				response_url: "https://queue.fal.run/fal-ai/flux/dev/requests/request-id",
			},
			"https://router.huggingface.co/fal-ai/fal-ai/flux/dev?_subdomain=queue",
			{ Authorization: "Bearer token" },
			"json",
			controller.signal,
		);

		controller.abort();

		await expect(responsePromise).rejects.toThrow(/aborted/i);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("passes the abort signal to fal-ai status polling fetches", async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>((_url, init) => {
			return new Promise<Response>((_resolve, reject) => {
				const signal = init?.signal;
				signal?.addEventListener(
					"abort",
					() => {
						reject(new DOMException("The operation was aborted", "AbortError"));
					},
					{ once: true },
				);
			});
		});
		vi.stubGlobal("fetch", fetchMock);

		const task = new FalAITextToImageTask();
		const controller = new AbortController();

		const responsePromise = task.getResponse(
			{
				request_id: "request-id",
				status: "IN_PROGRESS",
				response_url: "https://queue.fal.run/fal-ai/flux/dev/requests/request-id",
			},
			"https://router.huggingface.co/fal-ai/fal-ai/flux/dev?_subdomain=queue",
			{ Authorization: "Bearer token" },
			"json",
			controller.signal,
		);

		await vi.advanceTimersByTimeAsync(500);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("/status"),
			expect.objectContaining({ headers: { Authorization: "Bearer token" }, signal: controller.signal }),
		);

		controller.abort();

		await expect(responsePromise).rejects.toThrow(/aborted/i);
	});
});
