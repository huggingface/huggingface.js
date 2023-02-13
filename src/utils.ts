/**
 * Chunk array into arrays of length at most `chunkSize`
 *
 * @param chunkSize must be greater than or equal to 1
 */
export function chunk<T extends unknown[] | string>(arr: T, chunkSize: number): T[] {
	if (isNaN(chunkSize) || chunkSize < 1) {
		throw new RangeError("Invalid chunk size: " + chunkSize);
	}

	if (!arr.length) {
		return [];
	}

	/// Small optimization to not chunk buffers unless needed
	if (arr.length <= chunkSize) {
		return [arr];
	}

	return range(Math.ceil(arr.length / chunkSize)).map((i) => {
		return arr.slice(i * chunkSize, (i + 1) * chunkSize);
	}) as T[];
}

/**
 * One param:  create list of integers from 0 (inclusive) to n (exclusive)
 * Two params: create list of integers from a (inclusive) to b (exclusive)
 */
export function range(n: number, b?: number): number[] {
	return b
		? Array(b - n)
				.fill(0)
				.map((_, i) => n + i)
		: Array(n)
				.fill(0)
				.map((_, i) => i);
}

export function base64FromBytes(arr: Uint8Array): string {
	if (globalThis.Buffer) {
		return globalThis.Buffer.from(arr).toString("base64");
	} else {
		const bin: string[] = [];
		arr.forEach((byte) => {
			bin.push(String.fromCharCode(byte));
		});
		return globalThis.btoa(bin.join(""));
	}
}

export function hexFromBytes(arr: Uint8Array): string {
	if (globalThis.Buffer) {
		return globalThis.Buffer.from(arr).toString("hex");
	} else {
		const bin: string[] = [];
		arr.forEach((byte) => {
			bin.push(byte.toString(16).padStart(2, "0"));
		});
		return bin.join("");
	}
}

/**
 * Execute queue of promises in a streaming fashion.
 *
 * Optimized for streaming:
 * - Expects an iterable as input
 * - Does not return a list of all results
 *
 * Inspired by github.com/rxaviers/async-pool
 */
export async function promisesQueueStreaming<T>(
	factories: AsyncIterable<() => Promise<T>> | Iterable<() => Promise<T>>,
	concurrency: number
): Promise<void> {
	const executing: Promise<void>[] = [];
	for await (const factory of factories) {
		const e = factory().then(() => {
			executing.splice(executing.indexOf(e), 1);
		});
		executing.push(e);
		if (executing.length >= concurrency) {
			await Promise.race(executing);
		}
	}
	await Promise.all(executing);
}

/**
 * Execute queue of promises.
 *
 * Inspired by github.com/rxaviers/async-pool
 */
export async function promisesQueue<T>(factories: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
	const promises: Promise<T>[] = [];
	const executing: Promise<void>[] = [];
	for (const factory of factories) {
		const p = factory();
		promises.push(p);
		const e = p.then(() => {
			executing.splice(executing.indexOf(e), 1);
		});
		executing.push(e);
		if (executing.length >= concurrency) {
			await Promise.race(executing);
		}
	}
	return Promise.all(promises);
}

/**
 * Todo: make it go through a Worker
 * @returns hex-encoded sha
 */
export async function sha256(buffer: ArrayBuffer): Promise<string> {
	if (globalThis.crypto) {
		return hexFromBytes(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", buffer)));
	}

	const cryptoModule = await import("node:crypto");
	return cryptoModule.createHash("sha256").update(new Uint8Array(buffer)).digest().toString("hex");
}

export async function randomUUID(): Promise<string> {
	if (globalThis.crypto) {
		return globalThis.crypto.randomUUID();
	} else {
		return (await import("node:crypto")).randomUUID();
	}
}
