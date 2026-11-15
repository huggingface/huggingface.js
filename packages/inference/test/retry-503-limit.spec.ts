import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { innerRequest, innerStreamingRequest } from "../src/utils/request.js";
import { getProviderHelper } from "../src/lib/getProviderHelper.js";
import { InferenceClientProviderApiError } from "../src/errors.js";
import type { Options } from "../src/types.js";

type Mode = "HTTP" | "streaming";

function unavailable(status = 503): Response {
	return new Response("Service Unavailable", {
		status,
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}

function recovered(mode: Mode): Response {
	return mode === "HTTP"
		? new Response(JSON.stringify({ result: "ok" }), {
				headers: { "Content-Type": "application/json" },
			})
		: new Response('data: {"result":"ok"}\n\n', {
				headers: { "Content-Type": "text/event-stream" },
			});
}

async function invoke(mode: Mode, mockFetch: typeof fetch, options: Options = {}): Promise<unknown> {
	const args = {
		model: "test-model",
		endpointUrl: "https://test.example.com",
		accessToken: "hf_test",
		messages: [],
	};
	const helper = getProviderHelper("hf-inference", "conversational");
	let calls = 0;
	const boundedFetch: typeof fetch = (...args) => {
		// A synchronous retry regression can starve fake timers; fail before it exhausts the worker's memory.
		if (++calls > 12) {
			throw new Error("Request exceeded the test's fetch budget");
		}
		return mockFetch(...args);
	};
	const requestOptions = { ...options, fetch: boundedFetch, task: "conversational" as const };
	if (mode === "HTTP") {
		return (await innerRequest(args, helper, requestOptions)).data;
	}
	const generator = innerStreamingRequest(args, helper, requestOptions);
	try {
		return (await generator.next()).value;
	} finally {
		await generator.return(undefined);
	}
}

describe("503 retry limit", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
	});
	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	for (const mode of ["HTTP", "streaming"] as const) {
		it(`${mode} stops after ten delayed retries`, async () => {
			const times: number[] = [];
			const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
				times.push(Date.now());
				return Promise.resolve(unavailable());
			});
			const result = invoke(mode, mockFetch).catch((error: unknown) => error);
			await vi.runAllTimersAsync();
			expect(await result).toBeInstanceOf(InferenceClientProviderApiError);
			expect(mockFetch).toHaveBeenCalledTimes(11);
			expect(times).toEqual([0, 1_000, 3_000, 7_000, 15_000, 31_000, 61_000, 91_000, 121_000, 151_000, 181_000]);
			expect(vi.getTimerCount()).toBe(0);
		});

		it(`${mode} waits for a model that becomes ready after 60 seconds`, async () => {
			const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
				Promise.resolve(Date.now() < 60_000 ? unavailable() : recovered(mode)),
			);
			const result = invoke(mode, mockFetch).catch((error: unknown) => error);
			await vi.advanceTimersByTimeAsync(999);
			expect(mockFetch).toHaveBeenCalledTimes(1);
			await vi.runAllTimersAsync();
			expect(await result).toEqual({ result: "ok" });
			expect(mockFetch).toHaveBeenCalledTimes(7);
			expect(Date.now()).toBe(61_000);
			expect(vi.getTimerCount()).toBe(0);
		});

		it(`${mode} succeeds when the server recovers before the limit`, async () => {
			let calls = 0;
			const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
				Promise.resolve(++calls <= 3 ? unavailable() : recovered(mode)),
			);
			const result = invoke(mode, mockFetch);
			await vi.runAllTimersAsync();
			expect(await result).toEqual({ result: "ok" });
			expect(mockFetch).toHaveBeenCalledTimes(4);
		});

		it(`${mode} leaves a successful first response undelayed`, async () => {
			const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
				Promise.resolve(recovered(mode)),
			);
			expect(await invoke(mode, mockFetch)).toEqual({ result: "ok" });
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(vi.getTimerCount()).toBe(0);
		});

		it(`${mode} honors retry_on_error: false without scheduling a wait`, async () => {
			const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => Promise.resolve(unavailable()));
			await expect(invoke(mode, mockFetch, { retry_on_error: false })).rejects.toThrow(InferenceClientProviderApiError);
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(vi.getTimerCount()).toBe(0);
		});

		it(`${mode} does not retry other HTTP errors`, async () => {
			const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
				Promise.resolve(unavailable(400)),
			);
			await expect(invoke(mode, mockFetch)).rejects.toThrow(InferenceClientProviderApiError);
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(vi.getTimerCount()).toBe(0);
		});

		it(`${mode} releases each discarded response before waiting`, async () => {
			const cancel = vi.fn();
			let calls = 0;
			const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
				if (++calls > 1) {
					return Promise.resolve(recovered(mode));
				}
				return Promise.resolve(new Response(new ReadableStream({ cancel }), { status: 503 }));
			});
			const result = invoke(mode, mockFetch);
			await vi.advanceTimersByTimeAsync(0);
			expect(cancel).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledTimes(1);
			await vi.runAllTimersAsync();
			expect(await result).toEqual({ result: "ok" });
		});

		for (const alreadyAborted of [false, true]) {
			it(`${mode} cancels the wait with an ${alreadyAborted ? "already aborted" : "active"} signal`, async () => {
				const controller = new AbortController();
				const reason = new DOMException("Cancelled", "AbortError");
				if (alreadyAborted) {
					controller.abort(reason);
				}
				const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
					Promise.resolve(unavailable()),
				);
				const result = invoke(mode, mockFetch, { signal: controller.signal }).catch((error: unknown) => error);
				await vi.advanceTimersByTimeAsync(0);
				if (!alreadyAborted) {
					expect(vi.getTimerCount()).toBe(1);
					controller.abort(reason);
				}
				expect(await result).toBe(reason);
				expect(mockFetch).toHaveBeenCalledTimes(1);
				expect(mockFetch.mock.calls[0][1]?.signal).toBe(controller.signal);
				expect(vi.getTimerCount()).toBe(0);
			});
		}
	}
});
