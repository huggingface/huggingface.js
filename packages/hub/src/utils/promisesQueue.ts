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
