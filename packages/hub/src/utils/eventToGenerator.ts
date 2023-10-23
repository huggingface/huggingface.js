export async function* eventToGenerator<YieldType, ReturnType>(
	cb: (
		yieldCallback: (y: YieldType) => void,
		returnCallback: (r: ReturnType) => void,
		rejectCallack: (reason: unknown) => void
	) => unknown
): AsyncGenerator<YieldType, ReturnType> {
	let resolve: (value: { done: true; value: ReturnType } | { done: false; value: YieldType }) => void;
	let reject: (reason?: unknown) => void;
	let p = new Promise<{ done: true; value: ReturnType } | { done: false; value: YieldType }>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	const callbackRes = Promise.resolve()
		.then(() =>
			cb(
				(y) => {
					const res = resolve;
					p = new Promise<{ done: true; value: ReturnType } | { done: false; value: YieldType }>((res2, rej2) => {
						resolve = res2;
						reject = rej2;
					});
					res({ done: false, value: y });
				},
				(r) => {
					const res = resolve;
					p = new Promise<{ done: true; value: ReturnType } | { done: false; value: YieldType }>((res2, rej2) => {
						resolve = res2;
						reject = rej2;
					});
					res({ done: true, value: r });
				},
				(err) => reject(err)
			)
		)
		.catch((err) => reject(err));

	while (1) {
		const result = await p;
		if (result.done) {
			await callbackRes; // Clean up, may be removed in the future
			return result.value;
		}
		yield result.value;
	}

	// So TS doesn't complain
	throw new Error("Unreachable");
}
