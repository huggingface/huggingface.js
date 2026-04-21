function createAbortError(signal: AbortSignal): Error {
	return signal.reason instanceof Error ? signal.reason : new DOMException("The operation was aborted", "AbortError");
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
	if (signal?.aborted) {
		return Promise.reject(createAbortError(signal));
	}

	return new Promise((resolve, reject) => {
		const abortSignal = signal;
		const cleanup = () => {
			abortSignal?.removeEventListener("abort", onAbort);
		};

		const onAbort = () => {
			clearTimeout(timeout);
			cleanup();
			if (!abortSignal) {
				reject(new DOMException("The operation was aborted", "AbortError"));
				return;
			}
			reject(createAbortError(abortSignal));
		};

		const timeout = setTimeout(() => {
			cleanup();
			resolve();
		}, ms);
		timeout.unref?.();
		abortSignal?.addEventListener("abort", onAbort, { once: true });
	});
}
