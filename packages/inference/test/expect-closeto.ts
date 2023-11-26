// https://github.com/vitest-dev/vitest/pull/4260
// this file can be removed after vitest update to 1.0

import { expect } from "vitest";

expect.extend({
	closeTo(received: number, expected: number, precision: number) {
		const { isNot } = this;
		let pass = false;
		let expectedDiff = 0;
		let receivedDiff = 0;

		if (received === Infinity && expected === Infinity) {
			pass = true;
		} else if (received === -Infinity && expected === -Infinity) {
			pass = true;
		} else {
			expectedDiff = 10 ** -precision / 2;
			receivedDiff = Math.abs(expected - received);
			pass = receivedDiff < expectedDiff;
		}

		return {
			pass,
			message: () =>
				isNot
					? `expected ${received} to not be close to ${expected}, received difference is ${receivedDiff}, but expected ${expectedDiff}`
					: `expected ${received} to be close to ${expected}, received difference is ${receivedDiff}, but expected ${expectedDiff}`,
		};
	},
});
