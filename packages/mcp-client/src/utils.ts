import { inspect } from "util";

export function debug(...args: unknown[]): void {
	if (process.env.DEBUG) {
		console.debug(inspect(args, { depth: Infinity, colors: true }));
	}
}

export const ANSI = {
	BLUE: "\x1b[34m",
	GRAY: "\x1b[90m",
	GREEN: "\x1b[32m",
	RED: "\x1b[31m",
	RESET: "\x1b[0m",
};
