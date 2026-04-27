function createAbortError(signal: AbortSignal): Error {
	return signal.reason instanceof Error ? signal.reason : new DOMException("The operation was aborted", "AbortError");
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
	if (signal?.aborted) {
		return Promise.reject(createAbortError(signal));
	}

	return new Promise((resolve, reject) => {
		let cleanup = () => {};
		const timeout = setTimeout(() => {
			cleanup();
			resolve();
		}, ms);
		timeout.unref?.();

		if (!signal) {
			return;
		}

		const onAbort = () => {
			clearTimeout(timeout);
			cleanup();
			reject(createAbortError(signal));
		};
		cleanup = () => {
			signal.removeEventListener("abort", onAbort);
		};

		signal.addEventListener("abort", onAbort, { once: true });
	});
}
