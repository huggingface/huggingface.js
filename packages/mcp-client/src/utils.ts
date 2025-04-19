export function debug(...args: unknown[]): void {
	if (process.env.DEBUG) {
		console.log(args);
	}
}
