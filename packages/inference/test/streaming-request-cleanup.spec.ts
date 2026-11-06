import { describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/InferenceClient.js";
import { InferenceClientProviderApiError } from "../src/errors.js";

const chunk = {
	id: "completion-id",
	object: "chat.completion.chunk" as const,
	created: 0,
	model: "test-model",
	choices: [{ index: 0, delta: { content: "hello" }, finish_reason: null }],
};

function createCompletionStream(body: ReadableStream<Uint8Array>) {
	const client = new InferenceClient();
	return client.chatCompletionStream(
		{
			endpointUrl: "https://example.com",
			messages: [{ role: "user", content: "hello" }],
		},
		{
			fetch: async () => new Response(body, { headers: { "Content-Type": "text/event-stream" } }),
		},
	);
}

describe("streaming request cleanup", () => {
	it("cancels the response body when the consumer breaks out of the loop", async () => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
			},
			cancel,
		});

		for await (const output of createCompletionStream(body)) {
			expect(output).toEqual(chunk);
			break;
		}

		expect(cancel).toHaveBeenCalledTimes(1);
		expect(body.locked).toBe(false);
	});

	it("does not wait for the other branch of a cloned response to finish", async () => {
		const cancel = vi.fn();
		const response = new Response(
			new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
				},
				cancel,
			}),
			{ headers: { "Content-Type": "text/event-stream" } },
		);
		const clone = response.clone();
		const client = new InferenceClient();
		const stream = client.chatCompletionStream(
			{ endpointUrl: "https://example.com", messages: [{ role: "user", content: "hello" }] },
			{ fetch: async () => response },
		);

		await expect(stream.next()).resolves.toMatchObject({ value: chunk, done: false });
		let finished = false;
		const result = stream.return(undefined).then(() => {
			finished = true;
		});
		try {
			await vi.waitFor(() => expect(finished).toBe(true));
			expect(response.body?.locked).toBe(false);
			expect(cancel).not.toHaveBeenCalled();
		} finally {
			await clone.body?.cancel();
			await result;
		}
		expect(cancel).toHaveBeenCalledTimes(1);
	});

	it("cancels the response body after [DONE] without waiting for HTTP EOF", async () => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(
					new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\ndata: invalid\n\n`),
				);
			},
			cancel,
		});
		const outputs = [];
		for await (const output of createCompletionStream(body)) {
			outputs.push(output);
		}

		expect(outputs).toEqual([chunk]);
		expect(cancel).toHaveBeenCalledTimes(1);
		expect(body.locked).toBe(false);
	});

	it.each([
		["invalid JSON", "invalid", SyntaxError],
		["provider error", JSON.stringify({ error: "generation failed" }), InferenceClientProviderApiError],
	])("cancels the response body after %s", async (_name, data, errorType) => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
			},
			cancel,
		});

		await expect(createCompletionStream(body).next()).rejects.toBeInstanceOf(errorType);
		expect(cancel).toHaveBeenCalledTimes(1);
		expect(body.locked).toBe(false);
	});

	it("preserves parsing errors and releases the lock if cancellation rejects", async () => {
		const cancel = vi.fn(() => Promise.reject(new Error("cleanup failed")));
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode("data: invalid\n\n"));
			},
			cancel,
		});

		await expect(createCompletionStream(body).next()).rejects.toBeInstanceOf(SyntaxError);
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

		await expect(createCompletionStream(body).next()).rejects.toBe(error);
		expect(body.locked).toBe(false);
	});

	it("yields every chunk and releases the lock on normal HTTP EOF", async () => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
				controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
				controller.close();
			},
			cancel,
		});
		const outputs = [];
		for await (const output of createCompletionStream(body)) {
			outputs.push(output);
		}

		expect(outputs).toEqual([chunk, chunk]);
		expect(cancel).not.toHaveBeenCalled();
		expect(body.locked).toBe(false);
	});
});
