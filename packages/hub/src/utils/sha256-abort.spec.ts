import { afterEach, describe, expect, it, vi } from "vitest";
import { sha256 } from "./sha256";

// sha256() only reaches the worker path on the frontend.
vi.mock("./isBackend", () => ({ isBackend: false }));

/**
 * Node has no global Worker, so the pooled web-worker path in sha256() is
 * unreachable here without one. This stands in for it: it answers a single
 * postMessage with a finished hash, and records whether it was terminated.
 *
 * This file is excluded from the browser config, where the real Worker exists.
 */
class FakeWorker {
	static instances: FakeWorker[] = [];

	terminated = 0;
	private listeners: Record<string, Set<(event: unknown) => void>> = {};

	constructor() {
		FakeWorker.instances.push(this);
	}

	addEventListener(type: string, listener: (event: unknown) => void): void {
		(this.listeners[type] ??= new Set()).add(listener);
	}

	removeEventListener(type: string, listener: (event: unknown) => void): void {
		this.listeners[type]?.delete(listener);
	}

	postMessage(): void {
		setTimeout(() => {
			for (const listener of this.listeners["message"] ?? []) {
				listener({ data: { sha256: "deadbeef" } });
			}
		}, 0);
	}

	terminate(): void {
		this.terminated++;
	}
}

async function drain(iterator: AsyncGenerator<number, string>): Promise<string> {
	for (;;) {
		const next = await iterator.next();
		if (next.done) {
			return next.value;
		}
	}
}

describe("sha256 (pooled worker abort lifecycle)", () => {
	const originalWorker = globalThis.Worker;

	afterEach(() => {
		globalThis.Worker = originalWorker;
		FakeWorker.instances = [];
	});

	it("should not terminate a pooled worker when its signal aborts after the hash completed", async () => {
		globalThis.Worker = FakeWorker as unknown as typeof Worker;

		const abortController = new AbortController();
		const hash = await drain(
			// minSize keeps the small blob off the crypto.subtle fast path.
			sha256(new Blob(["hello"]), {
				useWebWorker: { poolSize: 2, minSize: 1 },
				abortSignal: abortController.signal,
			}),
		);

		expect(hash).toBe("deadbeef");

		const worker = FakeWorker.instances.at(-1);
		expect(worker?.terminated).toBe(0);

		// The caller aborts later — one signal typically covers a whole multi-file
		// commit, so this is the ordinary case, not an exotic one. The hash is
		// already done and its worker is back in the pool; aborting must not reach it.
		abortController.abort();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(worker?.terminated).toBe(0);
	});
});
