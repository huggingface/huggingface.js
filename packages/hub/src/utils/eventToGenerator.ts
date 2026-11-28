export async function* eventToGenerator<YieldType, ReturnType>(
	cb: (
		yieldCallback: (y: YieldType) => void,
		returnCallback: (r: ReturnType) => void,
		rejectCallack: (reason: unknown) => void,
	) => unknown,
): AsyncGenerator<YieldType, ReturnType> {
	type Event = { done: true; value: ReturnType } | { done: false; value: YieldType } | { error: unknown };
	const promises: Array<{ p: Promise<Event>; resolve: (value: Event) => void }> = [];

	function addPromise() {
		let resolve!: (value: Event) => void;
		const p = new Promise<Event>((res) => {
			resolve = res;
		});
		promises.push({ p, resolve });
	}

	function reject(reason: unknown) {
		// Queue failures after buffered progress, just like yield/return events.
		// Resolving an error event also avoids an unhandled rejection while the consumer is paused.
		addPromise();
		promises.at(-2)?.resolve({ error: reason });
	}

	addPromise();

	const callbackRes = Promise.resolve()
		.then(() =>
			cb(
				(y) => {
					addPromise();
					promises.at(-2)?.resolve({ done: false, value: y });
				},
				(r) => {
					addPromise();
					promises.at(-2)?.resolve({ done: true, value: r });
				},
				reject,
			),
		)
		.catch(reject);

	while (1) {
		const p = promises[0];
		if (!p) {
			throw new Error("Logic error in eventGenerator, promises should never be empty");
		}
		const result = await p.p;
		promises.shift();
		if ("error" in result) {
			throw result.error;
		}
		if (result.done) {
			await callbackRes; // Clean up, may be removed in the future
			// // Cleanup promises - shouldn't be needed due to above await
			// for (const promise of promises) {
			// 	promise.resolve(result);
			// 	await promise.p;
			// }
			return result.value;
		}
		yield result.value;
	}

	// So TS doesn't complain
	throw new Error("Unreachable");
}
