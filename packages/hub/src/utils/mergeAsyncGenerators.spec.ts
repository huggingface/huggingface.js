import { describe, expect, it } from "vitest";
import { mergeAsyncGenerators } from "./mergeAsyncGenerators";
import { splitAsyncGenerator } from "./splitAsyncGenerator";

describe("mergeAsyncGenerators", () => {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	it.each(["source error", "early break"])("settles %s while a sibling read is pending", async (mode) => {
		const error = new Error("download failed");
		let release!: () => void;
		const pending = new Promise<void>((resolve) => {
			release = resolve;
		});
		let closed = false;
		let finishCleanup!: () => void;
		const cleanup = new Promise<void>((resolve) => {
			finishCleanup = resolve;
		});
		async function* blocked() {
			try {
				await pending;
				yield 2;
			} finally {
				closed = true;
				finishCleanup();
			}
		}
		async function* ready() {
			if (mode === "source error") {
				yield await Promise.reject(error);
			}
			yield 1;
		}
		const sibling = blocked();
		const merged = mergeAsyncGenerators([ready(), sibling]);
		const consume = async () => {
			for await (const value of merged) {
				expect(value).toBe(1);
				break;
			}
		};
		const operation = consume().then(
			() => "complete",
			(reason) => reason,
		);
		let result: unknown;
		try {
			result = await Promise.race([operation, sleep(100).then(() => "still pending")]);
			expect(closed).toBe(false);
		} finally {
			release();
			await operation;
			await cleanup;
		}
		expect(result).toBe(mode === "source error" ? error : "complete");
		expect(closed).toBe(true);
	});

	it("closes active sources when the consumer breaks", async () => {
		const closed: number[] = [];
		let resolveCleanup!: () => void;
		const cleanup = new Promise<void>((resolve) => {
			resolveCleanup = resolve;
		});
		async function* source(id: number) {
			try {
				yield id;
				yield id + 10;
			} finally {
				closed.push(id);
				if (closed.length === 2) {
					resolveCleanup();
				}
			}
		}
		for await (const value of mergeAsyncGenerators([source(1), source(2)])) {
			expect(value).toBe(1);
			break;
		}
		await cleanup;
		expect(closed.sort()).toEqual([1, 2]);
	});

	it("closes siblings and preserves the source failure", async () => {
		const error = new Error("download failed");
		let closed = false;
		async function* failing(): AsyncGenerator<number> {
			yield await Promise.reject(error);
		}
		async function* sibling() {
			try {
				yield 2;
			} finally {
				closed = true;
				await Promise.reject(new Error("cleanup failed"));
			}
		}
		const merged = mergeAsyncGenerators([failing(), sibling()]);
		await expect(merged.next()).rejects.toBe(error);
		expect(closed).toBe(true);
	});

	it("should merge multiple async generators", async () => {
		const generator1 = (async function* () {
			yield 1;
			yield 2;
			await sleep(250);
			yield 3;
		})();
		const generator2 = (async function* () {
			await sleep(100);
			yield 4;
			yield 5;
			yield 6;
		})();
		const generator3 = (async function* () {
			await sleep(200);
			yield 7;
			yield 8;
			yield 9;
		})();

		const results: number[] = [];

		for await (const result of mergeAsyncGenerators([generator1, generator2, generator3])) {
			results.push(result);
		}
		expect(results).toEqual([1, 2, 4, 5, 6, 7, 8, 9, 3]);
	});

	it("should merge multiple async generators from a single source", async () => {
		const source = (async function* () {
			yield 1;
			yield 2;
			yield 3;
			yield 4;
			yield 5;
			yield 6;
			yield 7;
			yield 8;
			yield 9;
		})();
		const sources = splitAsyncGenerator(source, 3);

		const generator1 = (async function* () {
			for await (const result of sources[0]) {
				yield { result, gen: 1 };
				await sleep(100);
			}
		})();

		const generator2 = (async function* () {
			await sleep(50);
			for await (const result of sources[1]) {
				yield { result, gen: 2 };
				await sleep(100);
			}
		})();

		const generator3 = (async function* () {
			await sleep(80);
			let count = 0;
			for await (const result of sources[2]) {
				yield { result, gen: 3 };
				count++;

				if (count >= 2) {
					return;
				}
			}
		})();

		const results: { result: number; gen: number }[] = [];
		for await (const result of mergeAsyncGenerators([generator1, generator2, generator3])) {
			results.push(result);
		}
		expect(results.length).toBe(9);
		expect(results).toEqual([
			{ result: 1, gen: 1 },
			{ result: 2, gen: 2 },
			{ result: 3, gen: 3 },
			{ result: 4, gen: 3 },
			{ result: 5, gen: 1 },
			{ result: 6, gen: 2 },
			{ result: 7, gen: 1 },
			{ result: 8, gen: 2 },
			{ result: 9, gen: 1 },
		]);
	});
});
