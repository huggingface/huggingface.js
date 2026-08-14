import { afterEach, describe, expect, it, vi } from "vitest";
import { HFInferenceTask } from "../src/providers/hf-inference.js";
import { innerRequest, innerStreamingRequest } from "../src/utils/request.js";
import type { RequestArgs } from "../src/types.js";

const itWithFakeTimers = typeof window !== "undefined" && typeof window.document !== "undefined" ? it.skip : it;

const providerHelper = new HFInferenceTask();
const args: RequestArgs = { endpointUrl: "https://example.com/model", inputs: "hello" };

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function eventStreamResponse(): Response {
	return new Response(null, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

/**
 * Models a single reusable connection, like a real HTTP/1.1 keep-alive socket: the first 503
 * response's body is left open (a stalled provider that sent headers but never finished the
 * body), and any later fetch call blocks until that body is released via `cancel()`. If the
 * retry never releases it, the next request can never acquire the connection.
 */
function createSingleConnectionFetch(finalResponse: () => Response) {
	let connectionFree = true;
	let releaseWaiter: (() => void) | undefined;
	let fetchInvocations = 0;
	let serverRequests = 0;
	let cancelCalls = 0;

	const acquireConnection = () => {
		if (connectionFree) {
			connectionFree = false;
			return Promise.resolve();
		}
		return new Promise<void>((resolve) => {
			releaseWaiter = () => {
				connectionFree = false;
				resolve();
			};
		});
	};

	const releaseConnection = () => {
		connectionFree = true;
		releaseWaiter?.();
		releaseWaiter = undefined;
	};

	const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () => {
		fetchInvocations++;
		await acquireConnection();
		serverRequests++;
		if (serverRequests === 1) {
			const stalledBody = new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(new TextEncoder().encode('{"error":"loading"'));
					// deliberately never closed: the provider stalls mid-body
				},
				cancel() {
					cancelCalls++;
					releaseConnection();
				},
			});
			return new Response(stalledBody, { status: 503, headers: { "Content-Type": "application/json" } });
		}
		releaseConnection();
		return finalResponse();
	});

	return { fetchMock, stats: () => ({ fetchInvocations, serverRequests, cancelCalls }) };
}

function serverGoneWithRejectingCancel(): Response {
	const response = jsonResponse({ error: "loading" }, 503);
	// simulate cancel() rejecting (e.g. body already errored/closed) to make sure that doesn't
	// override the 503 retry handling
	if (response.body) {
		response.body.cancel = () => Promise.reject(new Error("already closed"));
	}
	return response;
}

async function drain<T>(gen: AsyncGenerator<T>): Promise<T[]> {
	const out: T[] = [];
	for await (const item of gen) {
		out.push(item);
	}
	return out;
}

describe("innerRequest 503 retry backoff", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	itWithFakeTimers("retries a bounded number of times, then surfaces the error", async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(jsonResponse({ error: "loading" }, 503)),
		);

		const assertion = expect(innerRequest(args, providerHelper, { fetch: fetchMock })).rejects.toThrow();
		await vi.runAllTimersAsync();
		await assertion;

		// 1 initial request + 5 retries
		expect(fetchMock).toHaveBeenCalledTimes(6);
	});

	itWithFakeTimers("waits with increasing delay between 503 retries", async () => {
		vi.useFakeTimers();
		let calls = 0;
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			calls++;
			return Promise.resolve(jsonResponse({ error: "loading" }, 503));
		});

		innerRequest(args, providerHelper, { fetch: fetchMock }).catch(() => {});

		await vi.advanceTimersByTimeAsync(0);
		expect(calls).toBe(1);

		await vi.advanceTimersByTimeAsync(999);
		expect(calls).toBe(1);
		await vi.advanceTimersByTimeAsync(1);
		expect(calls).toBe(2);

		await vi.advanceTimersByTimeAsync(1999);
		expect(calls).toBe(2);
		await vi.advanceTimersByTimeAsync(1);
		expect(calls).toBe(3);
	});

	itWithFakeTimers("aborts during the retry delay instead of issuing another request", async () => {
		vi.useFakeTimers();
		const controller = new AbortController();
		let calls = 0;
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			calls++;
			return Promise.resolve(jsonResponse({ error: "loading" }, 503));
		});

		const assertion = expect(
			innerRequest(args, providerHelper, { fetch: fetchMock, signal: controller.signal }),
		).rejects.toThrow(/aborted/i);

		await vi.advanceTimersByTimeAsync(0);
		expect(calls).toBe(1);

		controller.abort();
		await assertion;

		expect(calls).toBe(1);
	});

	it("does not retry when retry_on_error is false", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(jsonResponse({ error: "loading" }, 503)),
		);

		await expect(innerRequest(args, providerHelper, { fetch: fetchMock, retry_on_error: false })).rejects.toThrow();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("returns a successful response as-is without retrying", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(jsonResponse({ ok: true })),
		);

		const { data } = await innerRequest(args, providerHelper, { fetch: fetchMock });

		expect(data).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	itWithFakeTimers("recovers once the provider stops returning 503", async () => {
		vi.useFakeTimers();
		let calls = 0;
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			calls++;
			return Promise.resolve(calls === 1 ? jsonResponse({ error: "loading" }, 503) : jsonResponse({ ok: true }));
		});

		const requestPromise = innerRequest(args, providerHelper, { fetch: fetchMock });
		await vi.runAllTimersAsync();
		const { data } = await requestPromise;

		expect(data).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});

describe("innerStreamingRequest 503 retry backoff", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	itWithFakeTimers("retries a bounded number of times, then surfaces the error", async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(jsonResponse({ error: "loading" }, 503)),
		);

		const assertion = expect(
			drain(innerStreamingRequest(args, providerHelper, { fetch: fetchMock })),
		).rejects.toThrow();
		await vi.runAllTimersAsync();
		await assertion;

		expect(fetchMock).toHaveBeenCalledTimes(6);
	});

	itWithFakeTimers("aborts during the retry delay instead of issuing another request", async () => {
		vi.useFakeTimers();
		const controller = new AbortController();
		let calls = 0;
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			calls++;
			return Promise.resolve(jsonResponse({ error: "loading" }, 503));
		});

		const assertion = expect(
			drain(innerStreamingRequest(args, providerHelper, { fetch: fetchMock, signal: controller.signal })),
		).rejects.toThrow(/aborted/i);

		await vi.advanceTimersByTimeAsync(0);
		expect(calls).toBe(1);

		controller.abort();
		await assertion;

		expect(calls).toBe(1);
	});

	it("does not retry when retry_on_error is false", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(jsonResponse({ error: "loading" }, 503)),
		);

		await expect(
			drain(innerStreamingRequest(args, providerHelper, { fetch: fetchMock, retry_on_error: false })),
		).rejects.toThrow();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("returns a successful stream as-is without retrying", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(eventStreamResponse()),
		);

		await drain(innerStreamingRequest(args, providerHelper, { fetch: fetchMock }));

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	itWithFakeTimers("recovers once the provider stops returning 503", async () => {
		vi.useFakeTimers();
		let calls = 0;
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			calls++;
			return Promise.resolve(calls === 1 ? jsonResponse({ error: "loading" }, 503) : eventStreamResponse());
		});

		const genPromise = drain(innerStreamingRequest(args, providerHelper, { fetch: fetchMock }));
		await vi.runAllTimersAsync();
		await genPromise;

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});

describe("503 response body release", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	itWithFakeTimers("releases a stalled 503 body so a single-connection retry can proceed (innerRequest)", async () => {
		vi.useFakeTimers();
		const { fetchMock, stats } = createSingleConnectionFetch(() => jsonResponse({ ok: true }));

		const requestPromise = innerRequest(args, providerHelper, { fetch: fetchMock });
		let settled = false;
		requestPromise.then(() => (settled = true));

		// the first response settles and its body is cancelled before the retry delay starts
		await vi.advanceTimersByTimeAsync(0);
		expect(stats()).toEqual({ fetchInvocations: 1, serverRequests: 1, cancelCalls: 1 });

		// the retry delay elapses; without releasing the stalled body, the second fetch call
		// can never acquire the (single) connection and the request hangs forever
		await vi.advanceTimersByTimeAsync(1000);
		expect(settled).toBe(true);
		expect(stats()).toEqual({ fetchInvocations: 2, serverRequests: 2, cancelCalls: 1 });

		const { data } = await requestPromise;
		expect(data).toEqual({ ok: true });
	});

	itWithFakeTimers(
		"releases a stalled 503 body so a single-connection retry can proceed (innerStreamingRequest)",
		async () => {
			vi.useFakeTimers();
			const { fetchMock, stats } = createSingleConnectionFetch(() => eventStreamResponse());

			const genPromise = drain(innerStreamingRequest(args, providerHelper, { fetch: fetchMock }));
			let settled = false;
			genPromise.then(() => (settled = true));

			await vi.advanceTimersByTimeAsync(0);
			expect(stats()).toEqual({ fetchInvocations: 1, serverRequests: 1, cancelCalls: 1 });

			await vi.advanceTimersByTimeAsync(1000);
			expect(settled).toBe(true);
			expect(stats()).toEqual({ fetchInvocations: 2, serverRequests: 2, cancelCalls: 1 });

			await genPromise;
		},
	);

	itWithFakeTimers("still retries when cancelling the 503 body rejects (innerRequest)", async () => {
		vi.useFakeTimers();
		let calls = 0;
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			calls++;
			return Promise.resolve(calls === 1 ? serverGoneWithRejectingCancel() : jsonResponse({ ok: true }));
		});

		const requestPromise = innerRequest(args, providerHelper, { fetch: fetchMock });
		await vi.runAllTimersAsync();
		const { data } = await requestPromise;

		expect(data).toEqual({ ok: true });
		expect(calls).toBe(2);
	});

	itWithFakeTimers("still retries when cancelling the 503 body rejects (innerStreamingRequest)", async () => {
		vi.useFakeTimers();
		let calls = 0;
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			calls++;
			return Promise.resolve(calls === 1 ? serverGoneWithRejectingCancel() : eventStreamResponse());
		});

		const genPromise = drain(innerStreamingRequest(args, providerHelper, { fetch: fetchMock }));
		await vi.runAllTimersAsync();
		await genPromise;

		expect(calls).toBe(2);
	});

	itWithFakeTimers("does not throw when the 503 response has no body to cancel (innerRequest)", async () => {
		vi.useFakeTimers();
		let calls = 0;
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			calls++;
			return Promise.resolve(
				calls === 1
					? new Response(null, { status: 503, headers: { "Content-Type": "application/json" } })
					: jsonResponse({ ok: true }),
			);
		});

		const requestPromise = innerRequest(args, providerHelper, { fetch: fetchMock });
		await vi.runAllTimersAsync();
		const { data } = await requestPromise;

		expect(data).toEqual({ ok: true });
		expect(calls).toBe(2);
	});

	itWithFakeTimers("does not throw when the 503 response has no body to cancel (innerStreamingRequest)", async () => {
		vi.useFakeTimers();
		let calls = 0;
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => {
			calls++;
			return Promise.resolve(
				calls === 1
					? new Response(null, { status: 503, headers: { "Content-Type": "application/json" } })
					: eventStreamResponse(),
			);
		});

		const genPromise = drain(innerStreamingRequest(args, providerHelper, { fetch: fetchMock }));
		await vi.runAllTimersAsync();
		await genPromise;

		expect(calls).toBe(2);
	});
});
