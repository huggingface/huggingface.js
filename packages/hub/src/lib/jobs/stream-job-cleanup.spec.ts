import { describe, expect, it, vi } from "vitest";
import { streamJobEvents } from "./stream-job-events";
import { streamJobLogs } from "./stream-job-logs";
import { streamJobMetrics } from "./stream-job-metrics";

const event = new TextEncoder().encode('data: {"data":"hello","timestamp":"2026-01-01T00:00:00Z"}\n\n');

describe.each([
	["streamJobLogs", streamJobLogs],
	["streamJobEvents", streamJobEvents],
	["streamJobMetrics", streamJobMetrics],
] as const)("%s cleanup", (_name, streamJob) => {
	function createStream(response: Response) {
		return streamJob({
			namespace: "test-user",
			jobId: "test-job",
			accessToken: "hf_test",
			fetch: async () => response,
		});
	}

	it("cancels the response body when the consumer breaks out of the loop", async () => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(event);
			},
			cancel,
		});

		for await (const output of createStream(new Response(body))) {
			expect(output).toBeDefined();
			break;
		}

		expect(cancel).toHaveBeenCalledTimes(1);
		expect(body.locked).toBe(false);
	});

	it("does not wait for another branch of a cloned response to finish", async () => {
		const cancel = vi.fn();
		const response = new Response(
			new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(event);
				},
				cancel,
			}),
		);
		const clone = response.clone();
		const stream = createStream(response);
		await expect(stream.next()).resolves.toMatchObject({ done: false });
		let finished = false;
		const result = stream.return(undefined).then(() => {
			finished = true;
		});
		try {
			await vi.waitFor(() => expect(finished).toBe(true));
			expect(response.body?.locked).toBe(false);
			expect(cancel).not.toHaveBeenCalled();
		} finally {
			const cancelClone = clone.body?.cancel();
			await result;
			await response.body?.cancel();
			await cancelClone;
		}
		expect(cancel).toHaveBeenCalledTimes(1);
	});

	it("preserves consumer errors and releases the lock if cancellation rejects", async () => {
		const error = new Error("consumer failed");
		const cancel = vi.fn(() => Promise.reject(new Error("cleanup failed")));
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(event);
			},
			cancel,
		});

		const consume = async () => {
			for await (const output of createStream(new Response(body))) {
				expect(output).toBeDefined();
				throw error;
			}
		};
		await expect(consume()).rejects.toBe(error);
		expect(cancel).toHaveBeenCalledTimes(1);
		expect(body.locked).toBe(false);
	});

	it("preserves read errors and releases the lock on an errored body", async () => {
		const error = new Error("connection lost");
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.error(error);
			},
		});

		await expect(createStream(new Response(body)).next()).rejects.toBe(error);
		expect(body.locked).toBe(false);
	});

	it("yields every event and releases the lock on normal HTTP EOF", async () => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(event);
				controller.enqueue(event);
				controller.close();
			},
			cancel,
		});
		const outputs = [];
		for await (const output of createStream(new Response(body))) {
			outputs.push(output);
		}

		expect(outputs).toHaveLength(2);
		expect(outputs[0]).toEqual(outputs[1]);
		expect(cancel).not.toHaveBeenCalled();
		expect(body.locked).toBe(false);
	});
});
