import { describe, expect, it } from "vitest";
import { eventToGenerator } from "./eventToGenerator";

describe("eventToGenerator", () => {
	it("delivers queued progress before a synchronous producer failure", async () => {
		const error = new Error("upload failed");
		const iterator = eventToGenerator<number, void>((emit, _complete, reject) => {
			emit(1);
			emit(2);
			reject(error);
		});
		await expect(iterator.next()).resolves.toEqual({ done: false, value: 1 });
		await expect(iterator.next()).resolves.toEqual({ done: false, value: 2 });
		await expect(iterator.next()).rejects.toBe(error);
	}, 500);

	it("preserves a thrown producer error after buffered progress", async () => {
		const error = new Error("producer failed");
		const iterator = eventToGenerator<number, void>((emit) => {
			emit(1);
			emit(2);
			throw error;
		});
		await expect(iterator.next()).resolves.toEqual({ done: false, value: 1 });
		await expect(iterator.next()).resolves.toEqual({ done: false, value: 2 });
		await expect(iterator.next()).rejects.toBe(error);
	}, 500);

	it("propagates a failure without progress", async () => {
		const error = new Error("failed before upload");
		const iterator = eventToGenerator<never, void>((_emit, _complete, reject) => reject(error));
		await expect(iterator.next()).rejects.toBe(error);
	});

	it("should handle synchronous events", async () => {
		const it = eventToGenerator<number, number>((yieldCallback, returnCallback) => {
			yieldCallback(1);
			yieldCallback(2);
			returnCallback(3);
		});

		const results = [];
		let res: IteratorResult<number, number>;
		do {
			res = await it.next();
			if (!res.done) {
				results.push(res.value);
			}
		} while (!res.done);

		expect(results).toEqual([1, 2]);
		expect(res.value).toBe(3);
	});

	it("should handle asynchronous events", async () => {
		const it = eventToGenerator<number, number>((yieldCallback, returnCallback) => {
			setTimeout(() => yieldCallback(1), 100);
			setTimeout(() => yieldCallback(2), 200);
			setTimeout(() => returnCallback(3), 300);
		});

		const results = [];
		let res: IteratorResult<number, number>;
		do {
			res = await it.next();
			if (!res.done) {
				results.push(res.value);
			}
		} while (!res.done);

		expect(results).toEqual([1, 2]);
		expect(res.value).toBe(3);
	});
});
