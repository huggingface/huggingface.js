interface CustomMatchers<R = unknown> {
	closeTo(expected: number, precision: number): R;
}

declare global {
	namespace Vi {
		interface Assertion extends CustomMatchers {}
		interface AsymmetricMatchersContaining extends CustomMatchers {}
	}
}

export {};
