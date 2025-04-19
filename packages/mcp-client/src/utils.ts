export function debug(...args: unknown[]): void {
	if (process.env.DEBUG) {
		console.debug(args);
	}
}
