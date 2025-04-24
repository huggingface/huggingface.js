export function debug(...args: unknown[]): void {
	if (process.env.DEBUG) {
		console.debug(args);
	}
}

export const ANSI = {
	BLUE: "\x1b[34m",
	GRAY: "\x1b[90m",
	GREEN: "\x1b[32m",
	RED: "\x1b[31m",
	RESET: "\x1b[0m",
};
