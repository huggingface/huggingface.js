import { afterEach, describe, expect, it, vi } from "vitest";
import { splitAsyncGenerator } from "./splitAsyncGenerator";

afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
});

describe("splitAsyncGenerator", () => {
	it.each(["concurrent", "subsequent"])("releases the lock for a %s reader after rejection", async (timing) => {
		vi.useFakeTimers();
		const error = new Error("source failed");
		let rejectSource: (reason: Error) => void = () => undefined;
		const pending = new Promise<void>((_, reject) => {
			rejectSource = reject;
		});
		const source = (async function* () {
			await pending;
			yield 1;
		})();
		const [owner, peer] = splitAsyncGenerator(source, 2);
		const ownerRejected = expect(owner.next()).rejects.toBe(error);
		let peerResult: IteratorResult<number> | undefined;
		let peerError: unknown;
		const readPeer = () => {
			void peer.next().then(
				(result) => {
					peerResult = result;
				},
				(reason) => {
					peerError = reason;
				},
			);
		};

		if (timing === "concurrent") {
			readPeer();
			await vi.advanceTimersByTimeAsync(1);
		}
		rejectSource(error);
		await ownerRejected;
		if (timing === "subsequent") {
			readPeer();
		}
		await vi.advanceTimersByTimeAsync(5);

		expect(peerError).toBeUndefined();
		expect(peerResult).toEqual({ done: true, value: undefined });
	});

	it("distributes values exactly once with one active source read", async () => {
		const source = (async function* () {
			for (let value = 1; value <= 9; value++) {
				yield value;
			}
		})();
		const originalNext = source.next.bind(source);
		let active = 0;
		let maximumActive = 0;
		source.next = (...args) => {
			active++;
			maximumActive = Math.max(maximumActive, active);
			return originalNext(...args).finally(() => {
				active--;
			});
		};
		const results = await Promise.all(
			splitAsyncGenerator(source, 3).map(async (peer) => {
				const values: number[] = [];
				for await (const value of peer) {
					values.push(value);
				}
				return values;
			}),
		);

		expect(results.flat().sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		expect(maximumActive).toBe(1);
	});

	it("settles all readers when the source is empty", async () => {
		const source = (async function* () {})();
		const results = await Promise.all(splitAsyncGenerator(source, 3).map((peer) => peer.next()));
		expect(results.every((result) => result.done)).toBe(true);
	});

	it("returns the source only after every reader returns", async () => {
		let finalized = 0;
		const source = (async function* () {
			try {
				yield 1;
				yield 2;
			} finally {
				finalized++;
			}
		})();
		const peers = splitAsyncGenerator(source, 3);
		await peers[0].next();
		await peers[0].return(undefined);
		expect(finalized).toBe(0);
		await peers[1].return(undefined);
		expect(finalized).toBe(0);
		await peers[2].return(undefined);
		expect(finalized).toBe(1);
	});

	it("does not allocate readers for a non-positive count", () => {
		const source = (async function* () {
			yield 1;
		})();
		expect(splitAsyncGenerator(source, 0)).toEqual([]);
		expect(splitAsyncGenerator(source, -1)).toEqual([]);
	});
});
