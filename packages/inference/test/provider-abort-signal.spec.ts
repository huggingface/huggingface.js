import { afterEach, describe, expect, it, vi } from "vitest";
import { BlackForestLabsTextToImageTask } from "../src/providers/black-forest-labs.js";
import { FalAITextToImageTask } from "../src/providers/fal-ai.js";
import { ZaiImageToTextTask } from "../src/providers/zai-org.js";

const itWithFakeTimers = typeof window !== "undefined" && typeof window.document !== "undefined" ? it.skip : it;

describe("Provider abort signal propagation", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	itWithFakeTimers("aborts before the next fal-ai polling request starts", async () => {
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

	itWithFakeTimers("passes the abort signal to fal-ai status polling fetches", async () => {
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

	itWithFakeTimers("passes the abort signal to black-forest-labs polling fetches", async () => {
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

		const task = new BlackForestLabsTextToImageTask();
		const controller = new AbortController();

		const responsePromise = task.getResponse(
			{ id: "request-id", polling_url: "https://api.us1.bfl.ai/v1/get_result?id=request-id" },
			undefined,
			undefined,
			"json",
			controller.signal,
		);

		await vi.advanceTimersByTimeAsync(1000);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(URL),
			expect.objectContaining({
				headers: { "Content-Type": "application/json" },
				signal: controller.signal,
			}),
		);

		controller.abort();

		await expect(responsePromise).rejects.toThrow(/aborted/i);
	});

	it("passes the abort signal to zai image input downloads", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(new Response(new Blob(["image"], { type: "image/png" }))),
		);
		vi.stubGlobal("fetch", fetchMock);

		const task = new ZaiImageToTextTask();
		const controller = new AbortController();

		const payload = await task.preparePayloadAsync(
			{ inputs: "https://example.com/image.png" } as never,
			controller.signal,
		);

		expect((payload as Record<string, unknown>).inputs).toMatch(/^data:image\/png;base64,/);
		expect(fetchMock).toHaveBeenCalledWith("https://example.com/image.png", { signal: controller.signal });
	});
});
